import pg from 'pg'
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { hashPassword } from './auth.js'
import { seedAssetsDir } from './paths.js'
import { uploadToR2 } from './r2.js'

const { Pool } = pg

const __dirname = path.dirname(fileURLToPath(import.meta.url))

if (!process.env.DATABASE_URL) {
  console.warn(
    '[db] DATABASE_URL is not set. Point it at a Postgres connection ' +
      'string (e.g. a free Neon or Supabase project) before starting the server.',
  )
}

// Managed Postgres providers (Neon, Supabase, Render Postgres...) all sit
// behind TLS with a certificate chain Node won't auto-trust in this pooled
// setup — rejectUnauthorized:false is the standard pragmatic setting here.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=disable')
    ? false
    : { rejectUnauthorized: false },
})

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7

async function migrateLocalUploadsToR2() {
  const { rows } = await pool.query('SELECT data FROM content WHERE id = 1')
  if (rows.length === 0) return

  const contentStr = rows[0].data
  if (!contentStr.includes('/uploads/')) return

  console.log('[db] Found local /uploads/ paths in content — migrating to R2…')

  const localPaths = new Set(
    [...contentStr.matchAll(/\/uploads\/([^"]+)/g)].map((m) => m[1]),
  )
  const legacyUploadsDir = path.join(__dirname, 'uploads')
  const replacements = {}

  for (const filename of localPaths) {
    const seedFile = path.join(seedAssetsDir, filename)
    const legacyFile = path.join(legacyUploadsDir, filename)
    const localFile = existsSync(seedFile)
      ? seedFile
      : existsSync(legacyFile)
        ? legacyFile
        : null
    if (!localFile) {
      console.warn(`[db] Local file not found, skipping migration for: ${filename}`)
      continue
    }
    try {
      const buffer = readFileSync(localFile)
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
    console.warn('[db] No local files could be migrated for the /uploads/ paths found.')
    return
  }

  let updatedStr = contentStr
  for (const [oldPath, newUrl] of Object.entries(replacements)) {
    updatedStr = updatedStr.replaceAll(oldPath, newUrl)
  }

  await pool.query('UPDATE content SET data = $1, updated_at = $2 WHERE id = 1', [
    updatedStr,
    Date.now(),
  ])
  console.log('[db] Content updated with R2 URLs.')
}

// Content stored before a new top-level section was introduced (e.g. the
// "reviews" trust widget) won't have that key, and the frontend expects
// every SiteContent field to exist - back-fill anything missing from the
// seed defaults so old rows keep working after a deploy.
async function backfillMissingContentFields() {
  const { rows } = await pool.query('SELECT data FROM content WHERE id = 1')
  if (rows.length === 0) return

  const stored = JSON.parse(rows[0].data)
  const seedPath = path.join(__dirname, '..', 'content.seed.json')
  const seed = JSON.parse(readFileSync(seedPath, 'utf-8'))

  const missingKeys = Object.keys(seed).filter((key) => !(key in stored))
  if (missingKeys.length === 0) return

  const merged = { ...stored }
  for (const key of missingKeys) merged[key] = seed[key]

  await pool.query('UPDATE content SET data = $1, updated_at = $2 WHERE id = 1', [
    JSON.stringify(merged),
    Date.now(),
  ])
  console.log(`[db] Back-filled missing content fields: ${missingKeys.join(', ')}`)
}

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

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL,
      updated_at BIGINT NOT NULL
    );
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL
    );
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      created_at BIGINT NOT NULL,
      expires_at BIGINT NOT NULL
    );
  `)

  const { rows: contentRows } = await pool.query(
    'SELECT id FROM content WHERE id = 1',
  )
  if (contentRows.length === 0) {
    const seedPath = path.join(__dirname, '..', 'content.seed.json')
    const seed = readFileSync(seedPath, 'utf-8')
    await pool.query(
      'INSERT INTO content (id, data, updated_at) VALUES (1, $1, $2)',
      [seed, Date.now()],
    )
    console.log('[db] Seeded content from content.seed.json')
  }

  await migrateLocalUploadsToR2().catch((err) =>
    console.error('[db] R2 migration error:', err.message),
  )

  await backfillMissingContentFields().catch((err) =>
    console.error('[db] Content backfill error:', err.message),
  )

  const { rows: adminRows } = await pool.query('SELECT id FROM admin WHERE id = 1')
  if (adminRows.length === 0) {
    const password = process.env.ADMIN_PASSWORD || randomBytes(6).toString('base64url')
    const { hash, salt } = hashPassword(password)
    await pool.query(
      'INSERT INTO admin (id, password_hash, password_salt) VALUES (1, $1, $2)',
      [hash, salt],
    )
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
}

await init()

// Prints the DB host (never the username/password) so it's obvious from the
// boot log alone which database this process is actually talking to.
if (process.env.DATABASE_URL) {
  try {
    const { hostname } = new URL(process.env.DATABASE_URL)
    console.log(`[db] Connected to Postgres at ${hostname}`)
  } catch {
    console.log('[db] Connected to Postgres (could not parse host from DATABASE_URL)')
  }
}

export async function getContent() {
  const { rows } = await pool.query('SELECT data FROM content WHERE id = 1')
  return JSON.parse(rows[0].data)
}

export async function setContent(data) {
  await pool.query('UPDATE content SET data = $1, updated_at = $2 WHERE id = 1', [
    JSON.stringify(data),
    Date.now(),
  ])
}

export async function getAdmin() {
  const { rows } = await pool.query('SELECT * FROM admin WHERE id = 1')
  return rows[0]
}

export async function updateAdminPassword(hash, salt) {
  await pool.query(
    'UPDATE admin SET password_hash = $1, password_salt = $2 WHERE id = 1',
    [hash, salt],
  )
}

export async function createSession() {
  const token = randomBytes(32).toString('hex')
  const now = Date.now()
  await pool.query(
    'INSERT INTO sessions (token, created_at, expires_at) VALUES ($1, $2, $3)',
    [token, now, now + SESSION_TTL_MS],
  )
  return token
}

export async function validateSession(token) {
  if (!token) return false
  const { rows } = await pool.query('SELECT * FROM sessions WHERE token = $1', [
    token,
  ])
  if (rows.length === 0) return false
  if (Number(rows[0].expires_at) < Date.now()) {
    await pool.query('DELETE FROM sessions WHERE token = $1', [token])
    return false
  }
  return true
}

export async function deleteSession(token) {
  await pool.query('DELETE FROM sessions WHERE token = $1', [token])
}
