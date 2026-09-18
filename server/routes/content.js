import { Router } from 'express'
import { getContent, setContent } from '../db.js'
import { requireAuth } from './auth.js'
import { applyPriceChanges } from '../pricing.js'

const router = Router()

router.get('/', async (req, res) => {
  res.json(await getContent())
})

router.put('/', requireAuth, async (req, res) => {
  const body = req.body
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Neispravan format sadržaja.' })
  }

  if (body.services?.items) {
    const existing = await getContent()
    const today = new Date().toISOString().slice(0, 10)
    body.services.items = applyPriceChanges(
      existing.services.items,
      body.services.items,
      today,
    )
  }

  await setContent(body)
  res.json(await getContent())
})

export default router
