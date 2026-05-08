import sharp from 'sharp'

export async function convertToJpeg(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer).jpeg({ quality: 90 }).toBuffer()
  } catch {
    return buffer
  }
}
