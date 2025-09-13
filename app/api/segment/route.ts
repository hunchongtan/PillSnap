import { env } from '@/lib/env'
import axios from 'axios'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

function isErrorWithMessage(e: unknown): e is { message?: string } {
  return typeof e === 'object' && e !== null && 'message' in e
}

const FormSchema = z.object({
  // Either a file under key "file" or an imageUrl string
  imageUrl: z.string().url().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const imageUrlRaw = formData.get('imageUrl') as string | null
    const parsed = FormSchema.safeParse({ imageUrl: imageUrlRaw ?? undefined })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    const imageUrl = parsed.data.imageUrl ?? null

    if (!file && !imageUrl) {
      return NextResponse.json({ error: 'Provide file or imageUrl' }, { status: 400 })
    }

    let payload: string | undefined
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const base64 = buffer.toString('base64')
      payload = `data:${file.type};base64,${base64}`
    }

    const response = await axios({
      method: 'POST',
      url: `${env.ROBOFLOW_MODEL_URL}?api_key=${env.ROBOFLOW_API_KEY}`,
      params: imageUrl ? { image: imageUrl } : {},
      data: payload,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 15000,
    })
    return NextResponse.json(response.data, { status: 200 })
  } catch (e: unknown) {
    console.error('[segment] Error occurred while processing request')
    return NextResponse.json(
      {
        error: isErrorWithMessage(e) && typeof e.message === 'string' ? e.message : String(e),
      },
      { status: 500 }
    )
  }
}
