import { Router } from 'express'
import multer from 'multer'
import { randomBytes } from 'node:crypto'
import path from 'node:path'
import { requireAuth } from './auth.js'
import { uploadToR2 } from '../r2.js'

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

// Use memory storage — no files touch disk; buffer goes straight to R2.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return cb(new Error('Nepodržani format slike.'))
    }
    cb(null, true)
  },
})

const router = Router()

router.post('/', requireAuth, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message })
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Slika nije poslana.' })
    }

    try {
      const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg'
      const key = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`
      const url = await uploadToR2(req.file.buffer, key, req.file.mimetype)
      res.json({ url })
    } catch (uploadErr) {
      console.error('[upload] R2 upload failed:', uploadErr)
      res.status(500).json({ error: 'Pohrana slike nije uspjela.' })
    }
  })
})

export default router
