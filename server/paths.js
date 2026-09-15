import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// DATA_DIR lets a host's persistent volume be mounted anywhere
// (e.g. Render/Railway/Fly.io disks) without code changes - point the env var
// at the mounted path and the SQLite file lives there instead of inside the
// repo checkout, so it survives redeploys.
export const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, 'data')

// seedAssetsDir holds the default images that ship with the repo and are used
// for the one-time migration of any existing /uploads/ paths to R2.
export const seedAssetsDir = path.join(__dirname, 'seed-assets')
