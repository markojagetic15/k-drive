import './env.js'
import express from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import authRoutes from './routes/auth.js'
import contentRoutes from './routes/content.js'
import uploadRoutes from './routes/upload.js'
import inquiryRoutes from './routes/inquiry.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const distDir = path.join(rootDir, 'dist')

const app = express()
const PORT = process.env.PORT || 4000

// Trust the first hop reverse proxy (Railway/Render/Nginx etc.) so req.ip and
// req.secure reflect the real client instead of the proxy itself - needed for
// accurate rate limiting and for the "secure" cookie flag to work correctly.
app.set('trust proxy', 1)

// Derive the R2 public hostname for the CSP img-src directive so that images
// served from the R2 bucket (or a custom domain) are not blocked by the browser.
const r2PublicUrl = process.env.R2_PUBLIC_URL ?? ''
const r2Origin = (() => {
  if (!r2PublicUrl) return null
  try {
    return new URL(r2PublicUrl).origin
  } catch {
    return null
  }
})()

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        // Allow images from self, inline data URIs, blob URLs and the R2 bucket.
        imgSrc: ["'self'", 'data:', 'blob:', ...(r2Origin ? [r2Origin] : [])],
        connectSrc: ["'self'"],
        // The contact section embeds a Google Maps iframe.
        frameSrc: ["'self'", 'https://www.google.com'],
      },
    },
    // Disabled: would block the third-party Google Maps iframe embed, which
    // doesn't send the CORP headers this policy requires.
    crossOriginEmbedderPolicy: false,
  }),
)

app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())

// Note: /uploads static middleware removed — images are now stored in
// Cloudflare R2 and served directly from the bucket's public URL.
app.use('/api/auth', authRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/inquiry', inquiryRoutes)

if (existsSync(distDir)) {
  app.use(express.static(distDir))
  app.use((req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`[server] K-Drive API listening on http://localhost:${PORT}`)
})
