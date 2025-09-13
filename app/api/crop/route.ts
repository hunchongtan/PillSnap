// Type guard for error objects
function isErrorWithMessage(error: unknown): error is { message?: string } {
  return typeof error === 'object' && error !== null && 'message' in error
}
import { type NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { z } from 'zod'

export const runtime = 'nodejs'

interface Box {
  x: number // x in pixels (center or left depending on isTopLeft)
  y: number // y in pixels (center or top depending on isTopLeft)
  width: number // width in pixels
  height: number // height in pixels
}

const BoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
})

async function readMultipart(request: NextRequest): Promise<{
  buffer: Buffer
  mimeType: string
  box: Box
  paddingPct: number
  isTopLeft: boolean // Added isTopLeft to the return type
} | null> {
  const formData = await request.formData()
  const imageFile = formData.get('image') as File | null
  const boxJson = formData.get('box') as string | null
  const paddingPctStr = formData.get('paddingPct') as string | null
  const isTopLeftStr = formData.get('isTopLeft') as string | null // Added isTopLeft
  if (!imageFile || !boxJson) return null
  if (imageFile.size > 8 * 1024 * 1024) {
    throw new Error('Image too large (max 8MB)')
  }
  const buffer = Buffer.from(await imageFile.arrayBuffer())
  const mimeType = imageFile.type || 'image/jpeg'
  const boxParsed = BoxSchema.safeParse(JSON.parse(boxJson))
  if (!boxParsed.success) return null
  const box = boxParsed.data as Box
  const paddingPct = paddingPctStr ? Number(paddingPctStr) : 0.06
  const isTopLeft = isTopLeftStr === 'true' // Parse isTopLeft
  return { buffer, mimeType, box, paddingPct, isTopLeft } // Return isTopLeft
}

async function readJson(request: NextRequest): Promise<{
  buffer: Buffer
  mimeType: string
  box: Box
  paddingPct: number
  isTopLeft: boolean // Added isTopLeft to the return type
} | null> {
  const body = await request.json().catch(() => null as any)
  if (!body || !body.image || !body.box) return null
  const base64 = body.image as string // base64 without data: prefix
  const mimeType = (body.mimeType as string) || 'image/jpeg'
  const buffer = Buffer.from(base64, 'base64')
  if (buffer.byteLength > 8 * 1024 * 1024) {
    throw new Error('Image too large (max 8MB)')
  }
  const boxParsed = BoxSchema.safeParse(body.box)
  if (!boxParsed.success) return null
  const box = boxParsed.data as Box
  const paddingPct = typeof body.paddingPct === 'number' ? body.paddingPct : 0.06
  const isTopLeft = !!body.isTopLeft // Parse isTopLeft
  return { buffer, mimeType, box, paddingPct, isTopLeft } // Return isTopLeft
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let input: Awaited<ReturnType<typeof readJson>> | null = null
    if (contentType.startsWith('application/json')) {
      input = await readJson(request)
    } else {
      input = await readMultipart(request)
    }

    if (!input) {
      return NextResponse.json({ error: 'Missing image or bounding box' }, { status: 400 })
    }

    const { buffer, mimeType, box, paddingPct, isTopLeft } = input // Include isTopLeft

    // Auto-rotate for EXIF orientation
    let image = sharp(buffer).rotate()
    const meta = await image.metadata()
    const imgW = meta.width || 0
    const imgH = meta.height || 0
    if (!imgW || !imgH) {
      return NextResponse.json({ error: 'Invalid image' }, { status: 400 })
    }

    // Determine left/top depending on coordinate convention, then apply padding
    const padX = Math.round(box.width * paddingPct)
    const padY = Math.round(box.height * paddingPct)
    let width = Math.round(box.width + padX * 2)
    let height = Math.round(box.height + padY * 2)
    let left = isTopLeft ? Math.round(box.x - padX) : Math.round(box.x - box.width / 2 - padX)
    let top = isTopLeft ? Math.round(box.y - padY) : Math.round(box.y - box.height / 2 - padY)

    // Clamp to image bounds
    left = Math.max(0, Math.min(left, imgW - 1))
    top = Math.max(0, Math.min(top, imgH - 1))
    width = Math.max(1, Math.min(width, imgW - left))
    height = Math.max(1, Math.min(height, imgH - top))

    const cropped = await image
      .extract({ left, top, width, height })
      .jpeg({ quality: 92 })
      .toBuffer()
    const croppedMeta = await sharp(cropped).metadata()

    const base64Image = cropped.toString('base64')

    return NextResponse.json({
      image: base64Image,
      mimeType: 'image/jpeg',
      width: croppedMeta.width || width,
      height: croppedMeta.height || height,
    })
  } catch (error: unknown) {
    console.error('Error cropping image:', error)
    return NextResponse.json(
      {
        error: `Failed to crop image: ${
          isErrorWithMessage(error) && typeof error.message === 'string'
            ? error.message
            : String(error)
        }`,
      },
      { status: 500 }
    )
  }
}
