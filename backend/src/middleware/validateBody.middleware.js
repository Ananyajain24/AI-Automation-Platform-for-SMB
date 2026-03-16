export const validateBody = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body)
    next()
  } catch (err) {
    return res.status(400).json({ error: "Invalid request body" })
  }
}