import { supabase } from '../db/supabase.js'
import { generateEmbedding } from '../utils/embeddings.util.js'

export const searchRelevantChunks = async (
  business_id,
  query,
  limit = 3
) => {

  // 1️⃣ Generate embedding for query
  const embeddings = await generateEmbedding(query)

  const queryEmbedding = Array.isArray(embeddings)
    ? embeddings[0]
    : embeddings

  // 2️⃣ Call vector similarity function
  const { data, error } = await supabase.rpc(
    "match_document_chunks",
    {
      query_embedding: queryEmbedding,
      match_count: limit,
      business_id_input: business_id
    }
  )

  if (error) throw error

  // 3️⃣ Apply similarity threshold
  if (!data || data.length === 0 || data[0].similarity < 0.25) {
    return {
      sources: []
    }
  }

  return {
    sources: data
  }
}