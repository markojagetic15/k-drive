import { DatabaseSync } from 'node:sqlite'
import { randomBytes } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  copyFileSync,
} from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { hashPassword } from './auth.js'
import { dataDir, uploadsDir, seedAssetsDir } from './paths.js'

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

// Restore any missing default images on every boot (not just first seed) -
// self-heals if a default image is ever accidentally removed from uploads/,
// without ever overwriting a file that's already there.
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true })
for (const file of readdirSync(seedAssetsDir)) {
  const dest = path.join(uploadsDir, file)
  if (!existsSync(dest)) {
    copyFileSync(path.join(seedAssetsDir, file), dest)
    console.log(`[db] Restored missing default image: ${file}`)
  }
}

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
