import { z } from "zod"

export const searchSchema = z.object({
  query: z.string().min(3, "Query must be at least 3 characters")
})