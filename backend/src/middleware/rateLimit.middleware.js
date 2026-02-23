import rateLimit from 'express-rate-limit'

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // allow only 3 requests per minute
  standardHeaders: true,
  legacyHeaders: false
})