import { supabase } from '../db/supabase.js'
import { generateEmbedding } from '../utils/embeddings.util.js'
import { generateAnswer } from '../utils/llm.util.js'

export const searchRelevantChunks = async (business_id, query, limit = 3) => {

  const embeddings = await generateEmbedding(query)

  const { data, error } = await supabase.rpc(
    "match_document_chunks",
    {
      query_embedding: embeddings[0],
      match_count: limit,
      business_id_input: business_id
    }
  )

  if (error) throw error

  if (!data || data.length === 0 || data[0].similarity < 0.25) {
    return {
      answer: "I do not have that information.",
      sources: []
    }
  }

  const context = data.map(chunk => chunk.content).join("\n\n")

  const answer = await generateAnswer(query, context)

  // 🔥 INSERT CONVERSATION LOG HERE
  await supabase.from('conversations').insert([
    {
      business_id,
      channel: 'web',
      user_message: query,
      bot_reply: answer
    }
  ])

  return {
    answer,
    sources: data
  }
}