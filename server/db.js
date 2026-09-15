import { DatabaseSync } from 'node:sqlite'
import { randomBytes } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
} from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { hashPassword } from './auth.js'
import { dataDir, seedAssetsDir } from './paths.js'
import { uploadToR2 } from './r2.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })

const db = new DatabaseSync(path.join(dataDir, 'k-drive.sqlite'))

db.exec(`
  CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
`)

const contentRow = db.prepare('SELECT data FROM content WHERE id = 1').get()
if (!contentRow) {
  const seedPath = path.join(__dirname, '..', 'content.seed.json')
  const seed = readFileSync(seedPath, 'utf-8')
  db.prepare('INSERT INTO content (id, data, updated_at) VALUES (1, ?, ?)').run(
    seed,
    Date.now(),
  )
  console.log('[db] Seeded content from content.seed.json')
}

// ---------------------------------------------------------------------------
// One-time migration: rewrite any "/uploads/<filename>" paths in the content
// JSON to their Cloudflare R2 equivalents.  This runs on every boot but exits
// immediately once all paths have been migrated (no DB update needed).
// ---------------------------------------------------------------------------
async function migrateLocalUploadsToR2() {
  const row = db.prepare('SELECT data FROM content WHERE id = 1').get()
  if (!row) return

  const content = JSON.parse(row.data)
  const contentStr = row.data

  // Quick exit: nothing to migrate if there are no "/uploads/" references.
  if (!contentStr.includes('/uploads/')) {
    return
  }

  console.log('[db] Found local /uploads/ paths in content — migrating to R2…')

  // Collect every unique filename referenced under /uploads/.
  const localPaths = new Set(
    [...contentStr.matchAll(/\/uploads\/([^"]+)/g)].map((m) => m[1]),
  )

  // Build a mapping of old path → new R2 URL.
  const replacements = {}

  for (const filename of localPaths) {
    const localFile = path.join(seedAssetsDir, filename)
    if (!existsSync(localFile)) {
      console.warn(`[db] Seed asset not found, skipping migration for: ${filename}`)
      continue
    }
    try {
      const buffer = readFileSync(localFile)
      // Preserve the original filename as the R2 key so it's recognisable.
      const ext = path.extname(filename).toLowerCase() || '.jpg'
      const key = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`
      const url = await uploadToR2(buffer, key, mimeFromExt(ext))
      replacements[`/uploads/${filename}`] = url
      console.log(`[db] Migrated ${filename} → ${url}`)
    } catch (err) {
      console.error(`[db] Failed to migrate ${filename}:`, err.message)
    }
  }

  if (Object.keys(replacements).length === 0) {
    console.warn('[db] No assets could be migrated — check R2 env variables.')
    return
  }

  // Replace all occurrences of old paths in the JSON string.
  let updatedStr = contentStr
  for (const [oldPath, newUrl] of Object.entries(replacements)) {
    updatedStr = updatedStr.replaceAll(oldPath, newUrl)
  }

  db.prepare('UPDATE content SET data = ?, updated_at = ? WHERE id = 1').run(
    updatedStr,
    Date.now(),
  )
  console.log('[db] Content updated with R2 URLs.')
}

/** Derive a MIME type from a file extension. */
function mimeFromExt(ext) {
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  }
  return map[ext] ?? 'application/octet-stream'
}

// Run migration asynchronously; errors are caught and logged but never crash the server.
migrateLocalUploadsToR2().catch((err) =>
  console.error('[db] R2 migration error:', err),
)

const adminRow = db.prepare('SELECT id FROM admin WHERE id = 1').get()
if (!adminRow) {
  const password = process.env.ADMIN_PASSWORD || randomBytes(6).toString('base64url')
  const { hash, salt } = hashPassword(password)
  db.prepare(
    'INSERT INTO admin (id, password_hash, password_salt) VALUES (1, ?, ?)',
  ).run(hash, salt)
  if (!process.env.ADMIN_PASSWORD) {
    console.log('')
    console.log('========================================================')
    console.log(' No ADMIN_PASSWORD set in .env - generated one for you:')
    console.log(` Admin password: ${password}`)
    console.log(' Save it now. Set ADMIN_PASSWORD in .env to control it.')
    console.log('========================================================')
    console.log('')
  }
}

export function getContent() {
  const row = db.prepare('SELECT data FROM content WHERE id = 1').get()
  return JSON.parse(row.data)
}

export function setContent(data) {
  db.prepare('UPDATE content SET data = ?, updated_at = ? WHERE id = 1').run(
    JSON.stringify(data),
    Date.now(),
  )
}

export function getAdmin() {
  return db.prepare('SELECT * FROM admin WHERE id = 1').get()
}

export function updateAdminPassword(hash, salt) {
  db.prepare(
    'UPDATE admin SET password_hash = ?, password_salt = ? WHERE id = 1',
  ).run(hash, salt)
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7

export function createSession() {
  const token = randomBytes(32).toString('hex')
  const now = Date.now()
  db.prepare(
    'INSERT INTO sessions (token, created_at, expires_at) VALUES (?, ?, ?)',
  ).run(token, now, now + SESSION_TTL_MS)
  return token
}

export function validateSession(token) {
  if (!token) return false
  const row = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token)
  if (!row) return false
  if (row.expires_at < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
    return false
  }
  return true
}

export function deleteSession(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
}
