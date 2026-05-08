import { Storage } from '@google-cloud/storage'

function getStorage() {
  return new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    credentials: {
      client_email: process.env.GCS_CLIENT_EMAIL,
      private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  })
}

export async function uploadToGCS(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const storage = getStorage()
  const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!)
  const file = bucket.file(filename)
  await file.save(buffer, {
    metadata: { contentType },
  })
  await file.makePublic()
  return `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${filename}`
}

export async function deleteFromGCS(filename: string): Promise<void> {
  try {
    const storage = getStorage()
    const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!)
    await bucket.file(filename).delete()
  } catch (e) {
    console.error('GCS delete error:', e)
  }
}
