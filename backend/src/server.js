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



dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// 🔐 Protect routes
app.use('/business', verifyToken, businessRoutes)
app.use('/document', verifyToken, documentRoutes)

// 🔐 Protect chunks route
app.get('/chunks', verifyToken, async (req, res) => {
  try {
    const supabaseUserId = req.user.sub

    // Get business_id from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('business_id')
      .eq('supabase_user_id', supabaseUserId)
      .single()

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not linked to business' })
    }

    const { data, error } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('business_id', userData.business_id)

    if (error) return res.status(500).json(error)

    res.json(data)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// 🔐 Secure search endpoint
app.get('/search', verifyToken, rateLimiter, validateQuery(searchSchema), async (req, res) => {
  try {
    const supabaseUserId = req.user.sub
    const email = req.user.email
    const { query } = req.query

    if (!query) {
      return res.status(400).json({ error: 'Query is required' })
    }

logger.info("search_request", {
  user: req.user.sub,
  query
})

    // 🔎 Check if user exists
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('supabase_user_id', supabaseUserId)
      .single()

    // 🆕 If user does not exist → create business + user
    if (!userData) {
      console.log('Creating new business for user...')

      // 1️⃣ Create business
      const { data: newBusiness, error: businessError } = await supabase
        .from('businesses')
        .insert([
          {
            name: email + "'s Business",
            email: email
          }
        ])
        .select()
        .single()

      if (businessError) {
        return res.status(500).json({ error: businessError.message })
      }

      // 2️⃣ Create user mapping
      const { data: newUser, error: newUserError } = await supabase
        .from('users')
        .insert([
          {
            supabase_user_id: supabaseUserId,
            business_id: newBusiness.id,
            role: 'admin'
          }
        ])
        .select()
        .single()

      if (newUserError) {
        return res.status(500).json({ error: newUserError.message })
      }

      userData = newUser
    }

    // 🔎 Perform search
    const results = await searchRelevantChunks(
      userData.business_id,
      query
    )

    res.json(results)

  } catch (error) {
    console.error("ERROR:", error)
    res.status(500).json({ error: error.message })
  }
})


app.use(errorHandler)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})