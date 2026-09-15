import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// DATA_DIR / UPLOADS_DIR let a host's persistent volume be mounted anywhere
// (e.g. Render/Railway/Fly.io disks) without code changes - point the env var
// at the mounted path and the SQLite file + uploaded images live there instead
// of inside the repo checkout, so they survive redeploys.
export const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, 'data')

export const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, 'uploads')

export const seedAssetsDir = path.join(__dirname, 'seed-assets')
