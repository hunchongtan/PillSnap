import { saveUserSearch, searchPills, searchPillsAny } from '@/lib/database'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const AttributesSchema = z.object({
  shape: z.string().optional(),
  color: z.string().optional(),
  imprint: z.string().optional(),
  size_mm: z.number().optional(),
  scoring: z.string().optional(),
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

    // Primary (AND) search
    const strictResults = await searchPills({
      shape: attributes.shape,
      color: attributes.color,
      imprint: attributes.imprint,
      size_mm: attributes.size_mm,
      scoring: attributes.scoring,
    })

    // Broader (OR) fallback for any single attribute match to surface partial matches
    const broadResults = await searchPillsAny({
      shape: attributes.shape,
      color: attributes.color,
      imprint: attributes.imprint,
      scoring: attributes.scoring,
    })

    // Merge and de-duplicate by id (prefer strict result object reference)
    const mergedMap = new Map<string, any>()
    for (const p of strictResults) mergedMap.set(p.id, p)
    for (const p of broadResults) if (!mergedMap.has(p.id)) mergedMap.set(p.id, p)
    const merged = Array.from(mergedMap.values())

    // Determine if any meaningful attribute was provided (exclude scoring when it's 'no score')
    const anyAttrProvided = !!(
      (attributes.imprint && attributes.imprint.trim()) ||
      (attributes.shape && attributes.shape.trim()) ||
      (attributes.color && attributes.color.trim()) ||
      (typeof attributes.size_mm === 'number' && attributes.size_mm > 0) ||
      (attributes.scoring && attributes.scoring.trim() && attributes.scoring !== 'no score')
    )

    const enrichedRaw = merged.map((pill) => ({
      ...pill,
      confidence: computePillMatchConfidence(pill, attributes),
    }))

    const enriched = (
      anyAttrProvided ? enrichedRaw.filter((p) => (p.confidence ?? 0) > 0) : enrichedRaw
    ).sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))

    // Calculate confidence score based on attribute matches
    const confidenceScore = calculateAggregateConfidence(attributes, enriched)

    // Save the search to user_searches table for analytics
    const searchRecord = await saveUserSearch({
      detected_shape: attributes.shape,
      detected_color: attributes.color,
      detected_imprint: attributes.imprint,
      detected_size_mm: attributes.size_mm,
      user_confirmed_shape: attributes.shape,
      user_confirmed_color: attributes.color,
      user_confirmed_imprint: attributes.imprint,
      matched_pill_ids: enriched.map((pill) => pill.id),
      confidence_score: confidenceScore,
      session_id: sessionId || generateSessionId(),
      user_agent: request.headers.get('user-agent') || undefined,
    })

    return NextResponse.json({
      results: enriched,
      confidence: confidenceScore,
      searchId: searchRecord.id,
      totalResults: enriched.length,
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
  scoring?: string
}

// Per-pill confidence weighting
// Weights sum to 1.0 (imprint carries the most discriminative power)
const WEIGHTS = {
  imprint: 0.45,
  shape: 0.2,
  color: 0.15,
  size_mm: 0.1,
  scoring: 0.1,
} as const

function computePillMatchConfidence(pill: any, attrs: MinimalAttrs): number {
  // New logic: baseline is TOTAL_WEIGHT (all attributes). Missing attributes count as zero contribution.
  const TOTAL_WEIGHT =
    WEIGHTS.imprint + WEIGHTS.shape + WEIGHTS.color + WEIGHTS.size_mm + WEIGHTS.scoring
  let matchedWeight = 0
  let consideredWeight = 0 // weights for attributes the user actually supplied (for a secondary boost)

  const norm = (v?: string) => (v || '').trim().toLowerCase()

  // Imprint
  const pillImprint = norm(pill.imprint)
  const qImprint = norm(attrs.imprint)
  if (qImprint) {
    consideredWeight += WEIGHTS.imprint
    if (pillImprint && (pillImprint === qImprint || pillImprint.includes(qImprint))) {
      matchedWeight += WEIGHTS.imprint
    }
  }

  // Shape
  const pillShape = norm(pill.shape)
  const qShape = norm(attrs.shape)
  if (qShape) {
    consideredWeight += WEIGHTS.shape
    if (pillShape === qShape) matchedWeight += WEIGHTS.shape
  }

  // Color
  const pillColor = norm(pill.color)
  const qColor = norm(attrs.color)
  if (qColor) {
    consideredWeight += WEIGHTS.color
    if (pillColor === qColor) matchedWeight += WEIGHTS.color
  }

  // Size
  if (typeof attrs.size_mm === 'number' && attrs.size_mm > 0) {
    consideredWeight += WEIGHTS.size_mm
    if (typeof pill.size_mm === 'number' && pill.size_mm > 0) {
      const diff = Math.abs(pill.size_mm - attrs.size_mm)
      const sizeScore = diff <= 0.5 ? 1 : diff >= 2 ? 0 : 1 - (diff - 0.5) / (2 - 0.5)
      matchedWeight += WEIGHTS.size_mm * sizeScore
    }
  }

  // Scoring
  const pillScoring = norm(pill.scoring)
  const qScoring = norm(attrs.scoring)
  if (qScoring) {
    consideredWeight += WEIGHTS.scoring
    if (pillScoring === qScoring) matchedWeight += WEIGHTS.scoring
  }

  if (consideredWeight === 0) return 0

  // Primary ratio: matched vs total possible (penalizes missing attributes)
  const coverageRatio = matchedWeight / TOTAL_WEIGHT
  // Secondary ratio: how well we matched among only what user provided
  const providedQuality = matchedWeight / consideredWeight
  // Blend (favor actual match quality but still account for missing attributes)
  const blended = coverageRatio * 0.55 + providedQuality * 0.45
  return Math.min(1, blended)
}

function calculateAggregateConfidence(
  attributes: MinimalAttrs,
  results: Array<{ confidence?: number }>
): number {
  if (!results.length) return 0
  const confidences = results.map((r) => (typeof r.confidence === 'number' ? r.confidence : 0))
  const max = Math.max(...confidences)
  const avg = confidences.reduce((a, b) => a + b, 0) / confidences.length
  // Blend: 60% weight on best match, 40% on average to reflect both specificity and overall quality
  const blended = max * 0.6 + avg * 0.4
  return Math.min(1, blended)
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
