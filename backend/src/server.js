import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import { logger } from './utils/logger.js'
import businessRoutes from './routes/business.routes.js'
import documentRoutes from './routes/document.routes.js'
import { supabase } from './db/supabase.js'
import { searchRelevantChunks } from './services/retrieval.services.js'
import { verifyToken } from './middleware/auth.middleware.js'
import { validateQuery } from './middleware/validate.middleware.js'
import { searchSchema } from './schemas/search.schema.js'
import { errorHandler } from './middleware/error.middleware.js'
import { rateLimiter } from './middleware/rateLimit.middleware.js'
import { validateBody } from './middleware/validateBody.middleware.js'
import { chatSchema } from './schemas/chat.schema.js'
import { callLLM } from './utils/llm.util.js'
import { maybeSummarizeConversation } from './services/memory.service.js'
import { logUsage } from './modules/usage/usage.service.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// 🔐 Protect business & document routes
app.use('/business', verifyToken, businessRoutes)
app.use('/document', verifyToken, documentRoutes)


// ============================
// 🔎 SEARCH (Stateless RAG)
// ============================
app.get(
  '/search',
  verifyToken,
  rateLimiter,
  validateQuery(searchSchema),
  async (req, res) => {
    try {
      const supabaseUserId = req.user.sub
      const { query } = req.query

      logger.info("search_request", {
        user: supabaseUserId,
        query
      })

      const { data: userData } = await supabase
        .from('users')
        .select('business_id')
        .eq('supabase_user_id', supabaseUserId)
        .single()

      if (!userData) {
        return res.status(404).json({ error: 'User not linked to business' })
      }

      const results = await searchRelevantChunks(
        userData.business_id,
        query
      )

      res.json(results)

    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
)


// ============================
// 💬 CHAT (Memory + RAG)
// ============================
app.post(
  '/chat',
  verifyToken,
  rateLimiter,
  validateBody(chatSchema),
  async (req, res, next) => {
    try {
      const supabaseUserId = req.user.sub
      const { message, conversation_id } = req.body

      // 1️⃣ Get business
      const { data: userData } = await supabase
        .from('users')
        .select('business_id')
        .eq('supabase_user_id', supabaseUserId)
        .single()

      if (!userData) {
        return res.status(404).json({ error: 'User not linked to business' })
      }

      const businessId = userData.business_id

      // 2️⃣ Get or create conversation
      let conversationId = conversation_id

      if (!conversationId) {
        const { data: newConversation } = await supabase
          .from('conversations')
          .insert([{ business_id: businessId }])
          .select()
          .single()

        conversationId = newConversation.id
      }

      // 3️⃣ Save user message
      await supabase.from('messages').insert([
        {
          conversation_id: conversationId,
          role: 'user',
          content: message
        }
      ])

      // 4️⃣ Fetch conversation summary
      const { data: conversation } = await supabase
        .from('conversations')
        .select('summary')
        .eq('id', conversationId)
        .single()

      const summaryText = conversation?.summary || ''

      // 5️⃣ Retrieve recent messages (memory window)
      const { data: previousMessages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(6)

      const formattedHistory =
        previousMessages
          ?.map(msg =>
            `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
          )
          .join('\n') || ''

      // 6️⃣ Retrieve RAG context
      const retrieval = await searchRelevantChunks(
        businessId,
        message
      )

      const contextText =
        retrieval.sources
          ?.map(s => s.content)
          .join('\n\n') || ''

      // 7️⃣ Build final prompt
      const prompt = `
You are a professional business support assistant.
Answer ONLY using provided context.
If information is not in context, say:
"I do not have that information."

Conversation Summary:
${summaryText}

Recent Messages:
${formattedHistory}

Context:
${contextText}

Current Question:
${message}
`

      // 8️⃣ Call LLM
          
      const llmResponse = await callLLM(prompt)

      const answer = llmResponse.answer
      const tokens = llmResponse.tokens

      await logUsage({
      business_id: businessId,
      endpoint: "chat",
      tokens: tokens,
      model: "gpt-4o-mini"
      })


      // 9️⃣ Save assistant reply
      await supabase.from('messages').insert([
        {
          conversation_id: conversationId,
          role: 'assistant',
          content: answer
        }
      ])

      // 🔟 Maybe summarize long conversations
      await maybeSummarizeConversation(conversationId)

      res.json({
        conversation_id: conversationId,
        answer,
        sources: retrieval.sources
      })

    } catch (error) {
      next(error)
    }
  }
)


// ============================
// 🛑 Global Error Handler
// ============================
app.use(errorHandler)


const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})