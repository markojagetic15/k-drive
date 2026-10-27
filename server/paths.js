import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// seedAssetsDir holds the default images that ship with the repo. They get
// copied into uploadsDir on first boot so content.seed.json's /uploads/*.jpg
// references resolve without any external storage account.
export const seedAssetsDir = path.join(__dirname, 'seed-assets')

// uploadsDir holds admin-uploaded images, served at /uploads (see
// server/index.js). Mount this as a Docker volume so uploads survive
// container rebuilds.
export const uploadsDir = path.join(__dirname, 'uploads')
mkdirSync(uploadsDir, { recursive: true })
