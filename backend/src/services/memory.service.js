import { supabase } from '../db/supabase.js'
import { callLLM } from '../utils/llm.util.js'

export async function maybeSummarizeConversation(conversationId) {
  try {
    // 1️⃣ Fetch all messages in conversation
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error || !messages) return

    // 2️⃣ Only summarize if conversation is long
    if (messages.length <= 8) {
      return
    }

    // 3️⃣ Take older messages (keep last 2 untouched)
    const oldMessages = messages.slice(0, -2)

    const textToSummarize = oldMessages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n')

    // 4️⃣ Build summary prompt
    const summaryPrompt = `
Summarize the following conversation briefly.
Keep important facts, decisions, and context.
Be concise.

${textToSummarize}
`

    // 5️⃣ Generate summary using LLM
    const summary = await callLLM(summaryPrompt)

    // 6️⃣ Update conversation summary column
    await supabase
      .from('conversations')
      .update({ summary })
      .eq('id', conversationId)

    // 7️⃣ Delete old messages (compressed into summary)
    const oldMessageIds = oldMessages.map(m => m.id)

    await supabase
      .from('messages')
      .delete()
      .in('id', oldMessageIds)

  } catch (err) {
    console.error("Memory summarization error:", err.message)
  }
}