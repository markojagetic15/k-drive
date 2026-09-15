import { Router } from 'express'
import {
  getAdmin,
  createSession,
  deleteSession,
  validateSession,
} from '../db.js'
import { verifyPassword } from '../auth.js'
import { createRateLimiter } from '../rateLimit.js'

export const SESSION_COOKIE = 'k_drive_session'

// Slows down password-guessing: 10 attempts per 15 minutes per IP.
const isLoginRateLimited = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
})

export function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE]
  if (!validateSession(token)) {
    return res.status(401).json({ error: 'Niste prijavljeni.' })
  }
  next()
}

const router = Router()

router.post('/login', (req, res) => {
  if (isLoginRateLimited(req.ip)) {
    return res
      .status(429)
      .json({ error: 'Previše pokušaja prijave. Pokušajte ponovno kasnije.' })
  }

  const { password } = req.body ?? {}
  if (typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Lozinka je obavezna.' })
  }
  const admin = getAdmin()
  if (!admin || !verifyPassword(password, admin.password_hash, admin.password_salt)) {
    return res.status(401).json({ error: 'Pogrešna lozinka.' })
  }
  const token = createSession()
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  })
  res.json({ ok: true })
})

router.post('/logout', (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE]
  if (token) deleteSession(token)
  res.clearCookie(SESSION_COOKIE)
  res.json({ ok: true })
})

router.get('/me', (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE]
  res.json({ authenticated: validateSession(token) })
})

export default router
