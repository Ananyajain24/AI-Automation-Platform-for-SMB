import { z } from "zod"

export const chatSchema = z.object({
  message: z.string().min(2),
  conversation_id: z.string().uuid().optional()
})