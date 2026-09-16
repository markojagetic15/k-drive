import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// seedAssetsDir holds the default images that ship with the repo and are used
// for the one-time migration of any existing /uploads/ paths to R2.
export const seedAssetsDir = path.join(__dirname, 'seed-assets')
