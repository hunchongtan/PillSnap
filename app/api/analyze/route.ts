// /app/api/analyze/route.ts
import { COLOR_OPTIONS, SCORING_OPTIONS, SHAPE_OPTIONS } from '@/constants/pill-options'
import { env } from '@/lib/env'
import { type NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'

export const runtime = 'nodejs'

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

// Narrow unknown errors
function isErrorWithProps(
  e: unknown
): e is { message?: string; code?: string; type?: string; status?: number } {
  return typeof e === 'object' && e !== null
}

// === Normalization helpers ===
const allowedSinglesLower = new Set(
  COLOR_OPTIONS.filter((c) => !c.includes('&')).map((c) => c.toLowerCase())
)
const allowedTwoToneOtherLower = new Set(
  COLOR_OPTIONS.filter((c) => c.includes('&'))
    .map((c) => c.toLowerCase())
    .map((c) => c.replace(/\s*&\s*white\s*$/i, '').trim())
    .filter((c) => c && c !== 'white')
)

function normalizeColor(input: unknown): string {
  if (typeof input !== 'string') return ''
  let s = input.trim()
  if (!s) return ''
  // Normalize separators to ' & '
  s = s.replace(/[\/|,-]/g, ' & ')
  s = s.replace(/\s+/g, ' ').replace(/\s*&\s*/g, ' & ')
  const lower = s.toLowerCase()

  // Exact single match
  if (allowedSinglesLower.has(lower)) {
    const match = COLOR_OPTIONS.find((c) => c.toLowerCase() === lower)
    return match || ''
  }

  // Handle two-tone with White + allowed other color (normalized to "Color & White")
  const parts = lower.split('&').map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 2) {
    const hasWhite = parts.includes('white')
    if (hasWhite) {
      const other = parts.find((p) => p !== 'white')
      if (other && allowedTwoToneOtherLower.has(other)) {
        const formatted = `${other.charAt(0).toUpperCase()}${other.slice(1)} & White`
        const match = COLOR_OPTIONS.find((c) => c.toLowerCase() === formatted.toLowerCase())
        return match || ''
      }
    }
  }
  return ''
}

function normalizeShape(input: unknown): string {
  if (typeof input !== 'string') return ''
  const lower = input.trim().toLowerCase()
  const match = SHAPE_OPTIONS.find((s) => s.toLowerCase() === lower)
  return match || ''
}

function normalizeScoring(input: unknown): string {
  if (typeof input !== 'string') return 'no score'
  const lower = input.trim().toLowerCase()
  const match = SCORING_OPTIONS.find((s) => s.toLowerCase() === lower)
  return match || 'no score'
}

// === Schema: attributes-only ===
const PillAttributesSchema = z
  .object({
    shape: z.enum(SHAPE_OPTIONS).or(z.literal('')).default(''),
    color: z.enum(COLOR_OPTIONS).or(z.literal('')).default(''),
    size_mm: z.coerce.number().min(0).default(0),
    imprint: z.string().default(''),
    scoring: z.enum(SCORING_OPTIONS).default('no score'),
  })
  .strict()

const OutputSchema = z
  .object({
    attributes: PillAttributesSchema,
  })
  .strict()

// === Prompt ===
function buildPrompt() {
  const allowedShapes = SHAPE_OPTIONS.join(' | ')
  const allowedColors = COLOR_OPTIONS.join(' | ')
  const allowedScoring = SCORING_OPTIONS.join(' | ')
  return `
Return a single JSON object exactly like this (valid JSON, no extra keys):

{
  "attributes": {
    "shape": string,   // MUST be one of: ${allowedShapes} (or "" if unknown)
    "color": string,   // MUST be one of: ${allowedColors} (or "" if unknown)
    "size_mm": number,
    "imprint": string,
    "scoring": "${allowedScoring}",  // MUST be one of these values
  }
}

Rules:
- Choose shape/color ONLY from the lists; if unsure, use empty string "".
- Scoring MUST be exactly one of ${allowedScoring}; use "no score" when unclear or absent.
- Do not identify the medicine; extract visible attributes only.
- Output JSON only.
`.trim()
}

export async function POST(request: NextRequest) {
  try {
    // env is already validated at import time

    if (!request.headers.get('content-type')?.startsWith('application/json')) {
      return NextResponse.json(
        { error: "Invalid Content-Type. Expected 'application/json'." },
        { status: 400 }
      )
    }

    const { image, mimeType } = (await request.json()) as {
      image?: string // base64 (no prefix)
      mimeType?: string // e.g., "image/jpeg"
    }

    if (!image) {
      return NextResponse.json({ error: 'No image provided.' }, { status: 400 })
    }
    if (!mimeType || !mimeType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid mimeType. Please provide an image mime type.' },
        { status: 400 }
      )
    }

    // Build data URL for multimodal block (do NOT paste into text)
    const dataUrl = `data:${mimeType};base64,${image}`
    const prompt = buildPrompt()

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      response_format: { type: 'json_object' }, // require valid JSON
      messages: [
        {
          role: 'system',
          content:
            'You are a vision assistant. Output valid JSON only. Do not include any text outside of the JSON.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt }, // contains the word "JSON" to satisfy API requirement
            { type: 'image_url', image_url: { url: dataUrl } },
          ] as any,
        },
      ],
    })

    const raw = resp.choices[0]?.message?.content ?? '{}'
    const obj = JSON.parse(raw) as any
    obj.attributes = obj.attributes ?? {}
    obj.attributes.color = normalizeColor(obj.attributes.color)
    obj.attributes.shape = normalizeShape(obj.attributes.shape)
    obj.attributes.scoring = normalizeScoring(obj.attributes.scoring)
    if (typeof obj.attributes.imprint !== 'string') obj.attributes.imprint = ''
    const parsed = OutputSchema.parse(obj)
    if (parsed?.attributes?.size_mm && Number.isFinite(parsed.attributes.size_mm)) {
      parsed.attributes.size_mm = Math.round(parsed.attributes.size_mm * 10) / 10
    }

    return NextResponse.json(parsed)
  } catch (error: unknown) {
    console.error('Error analyzing pill:', error)

    const message =
      isErrorWithProps(error) && typeof error.message === 'string' ? error.message : String(error)

    // Specific buckets
    if (isErrorWithProps(error) && error.code === 'context_length_exceeded') {
      return NextResponse.json(
        {
          error:
            'Context too large. Ensure you are not embedding base64 inside text; use image_url blocks.',
        },
        { status: 400 }
      )
    }
    if (isErrorWithProps(error) && (error.code === 'insufficient_quota' || error.status === 429)) {
      return NextResponse.json({ error: 'OpenAI API quota exceeded.' }, { status: 429 })
    }
    if (isErrorWithProps(error) && (error.code === 'invalid_api_key' || error.status === 401)) {
      return NextResponse.json({ error: 'Invalid OpenAI API key.' }, { status: 401 })
    }
    if (isErrorWithProps(error) && (error.code === 'model_not_found' || error.status === 404)) {
      return NextResponse.json({ error: 'OpenAI model not found or unavailable.' }, { status: 404 })
    }
    if (
      isErrorWithProps(error) &&
      (message.toLowerCase().includes('timeout') || error.code === 'TIMEOUT')
    ) {
      return NextResponse.json(
        { error: 'Request timed out. Try a smaller image or retry.' },
        { status: 408 }
      )
    }
    if (
      isErrorWithProps(error) &&
      (message.toLowerCase().includes('network') || error.code === 'ENOTFOUND')
    ) {
      return NextResponse.json(
        { error: 'Network error. Please check connectivity and retry.' },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: `Failed to analyze pill image: ${message}` }, { status: 500 })
  }
}
