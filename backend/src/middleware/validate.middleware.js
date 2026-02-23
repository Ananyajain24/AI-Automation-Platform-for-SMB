export const validateQuery = (schema) => (req, res, next) => {
  try {
    schema.parse(req.query)
    next()
  } catch (error) {
    return res.status(400).json({
      error: error.errors?.[0]?.message || "Invalid request"
    })
  }
}