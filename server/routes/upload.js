import { Router } from 'express'
import multer from 'multer'
import { randomBytes } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { requireAuth } from './auth.js'
import { uploadsDir } from '../paths.js'

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

// Memory storage: validate the buffer first, then write it to uploadsDir
// ourselves with a generated name (keeps the same validate-then-persist flow
// this route always had, just swapping the persistence target).
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
      await writeFile(path.join(uploadsDir, key), req.file.buffer)
      res.json({ url: `/uploads/${key}` })
    } catch (uploadErr) {
      console.error('[upload] Local save failed:', uploadErr)
      res.status(500).json({ error: 'Pohrana slike nije uspjela.' })
    }
  })
})

export default router
