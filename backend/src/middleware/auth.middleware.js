import { jwtVerify, createRemoteJWKSet } from 'jose'

const SUPABASE_URL = process.env.SUPABASE_URL

if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL not defined in environment variables')
}

// Create remote JWKS (cached automatically by jose)
const JWKS = createRemoteJWKSet(
  new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
)

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' })
    }

    const token = authHeader.split(' ')[1]

    // Verify token signature + issuer
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${SUPABASE_URL}/auth/v1`,
      audience: 'authenticated'
    })

    // Attach user info to request
    req.user = payload

    next()
  } catch (err) {
    console.error('JWT verification failed:', err.message)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}