import OpenAI from "openai"
import dotenv from "dotenv"

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const generateEmbedding = async (input) => {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: input // can be string OR array
  })

  return response.data.map(obj => obj.embedding)
}