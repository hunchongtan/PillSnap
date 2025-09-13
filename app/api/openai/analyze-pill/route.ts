import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST() {
  return NextResponse.json(
    {
      error: 'Endpoint removed. Use /api/analyze with JSON body { image, mimeType }.',
    },
    { status: 410 }
  )
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'Endpoint removed. Use /api/analyze with JSON body { image, mimeType }.',
    },
    { status: 410 }
  )
}
