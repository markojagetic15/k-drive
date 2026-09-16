import { Router } from 'express'
import { getContent } from '../db.js'

const router = Router()

// Public, unauthenticated - meant to be pinged by an uptime monitor. Touches
// the database so a real outage (not just "the process is alive") gets caught.
router.get('/', async (req, res) => {
  try {
    await getContent()
    res.json({ status: 'ok', time: new Date().toISOString() })
  } catch (err) {
    res.status(503).json({ status: 'error', error: err.message })
  }
})

export default router
