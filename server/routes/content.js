import { Router } from 'express'
import { getContent, setContent } from '../db.js'
import { requireAuth } from './auth.js'

const router = Router()

router.get('/', (req, res) => {
  res.json(getContent())
})

router.put('/', requireAuth, (req, res) => {
  const body = req.body
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Neispravan format sadržaja.' })
  }
  setContent(body)
  res.json(getContent())
})

export default router
