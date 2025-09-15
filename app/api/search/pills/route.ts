import { saveUserSearch, searchPills } from '@/lib/database'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const AttributesSchema = z.object({
  shape: z.string().optional(),
  color: z.string().optional(),
  imprint: z.string().optional(),
  size_mm: z.number().optional(),
})

const BodySchema = z.object({
  attributes: AttributesSchema,
  sessionId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid search payload' }, { status: 400 })
    }
    const { attributes, sessionId } = parsed.data

    // Search the database using the provided attributes
    const searchResults = await searchPills({
      shape: attributes.shape,
      color: attributes.color,
      imprint: attributes.imprint,
      size_mm: attributes.size_mm,
    })

    // Calculate confidence score based on attribute matches
    const confidenceScore = calculateSearchConfidence(attributes, searchResults)

    // Save the search to user_searches table for analytics
    const searchRecord = await saveUserSearch({
      detected_shape: attributes.shape,
      detected_color: attributes.color,
      detected_imprint: attributes.imprint,
      detected_size_mm: attributes.size_mm,
      user_confirmed_shape: attributes.shape,
      user_confirmed_color: attributes.color,
      user_confirmed_imprint: attributes.imprint,
      matched_pill_ids: searchResults.map((pill) => pill.id),
      confidence_score: confidenceScore,
      session_id: sessionId || generateSessionId(),
      user_agent: request.headers.get('user-agent') || undefined,
    })

    return NextResponse.json({
      results: searchResults,
      confidence: confidenceScore,
      searchId: searchRecord.id,
      totalResults: searchResults.length,
    })
  } catch (error) {
    console.error('[search/pills] API error')
    return NextResponse.json({ error: 'Internal server error during pill search' }, { status: 500 })
  }
}

type MinimalAttrs = {
  shape?: string
  color?: string
  imprint?: string
  size_mm?: number
}

function calculateSearchConfidence(attributes: MinimalAttrs, results: any[]): number {
  if (results.length === 0) return 0

  // Base confidence on number of matching attributes and result count
  let confidence = 0.3 // Base confidence

  // Add confidence for each matching attribute
  if (attributes.shape) confidence += 0.2
  if (attributes.color) confidence += 0.2
  if (attributes.imprint) confidence += 0.25
  if (attributes.size_mm) confidence += 0.05

  // Reduce confidence if too many results (less specific)
  if (results.length > 10) confidence *= 0.8
  else if (results.length > 5) confidence *= 0.9

  // Boost confidence for exact matches (fewer results)
  if (results.length <= 3) confidence *= 1.1

  return Math.min(confidence, 1.0)
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
