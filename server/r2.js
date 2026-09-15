import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// R2_ENDPOINT  – private S3-compatible API endpoint, e.g.
//   https://<accountId>.r2.cloudflarestorage.com
// R2_BUCKET_NAME – just the bucket name (string), e.g. "k-drive-media"
// R2_PUBLIC_URL  – public base URL for reading objects, e.g.
//   https://pub-<hash>.r2.dev  OR  https://media.yourdomain.com
const {
  R2_ENDPOINT,
  R2_BUCKET_NAME,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_PUBLIC_URL,
} = process.env

if (!R2_ENDPOINT || !R2_BUCKET_NAME || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_URL) {
  console.warn(
    '[r2] One or more R2 env variables are missing ' +
    '(R2_ENDPOINT, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL). ' +
    'Image uploads will fail until all variables are set.',
  )
}

const client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: R2_SECRET_ACCESS_KEY ?? '',
  },
})

/**
 * Upload a buffer to Cloudflare R2 and return its public URL.
 *
 * @param {Buffer} buffer      - File content
 * @param {string} key         - Object key / path inside the bucket (e.g. "hero-workshop.jpg")
 * @param {string} contentType - MIME type (e.g. "image/jpeg")
 * @returns {Promise<string>}  - Full public URL of the uploaded object
 */
export async function uploadToR2(buffer, key, contentType) {
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )
  const publicBase = (R2_PUBLIC_URL ?? '').replace(/\/$/, '')
  return `${publicBase}/${key}`
}
