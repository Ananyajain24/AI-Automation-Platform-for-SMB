import OpenAI from "openai"
import dotenv from "dotenv"

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const callLLM = async (prompt) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional business support AI."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 600
    })

    return {
      answer: response.choices[0].message.content.trim(),
      tokens: response.usage.total_tokens
    }

  } catch (error) {
    console.error("LLM Error:", error.message)   
    return {
      answer : "Sorry, I'm exoeriencing technical issues",
      tokens: 0
    }  
    
  }
}