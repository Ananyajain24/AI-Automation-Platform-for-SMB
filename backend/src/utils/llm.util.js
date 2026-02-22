import OpenAI from "openai"
import dotenv from "dotenv"

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const generateAnswer = async (question, context) => {

  try {
    const prompt = `
You are a helpful customer support assistant.

Answer the question using ONLY the context below.
If the answer is not in the context, say:
"I do not have that information."

Context:
${context}

Question:
${question}

Answer:
`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    })

    return response.choices[0].message.content

  } catch (error) {
    console.error("LLM Error:", error.message)
    return "Sorry, I'm experiencing technical issues."
  }
}