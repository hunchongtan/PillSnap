import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const PillSchema = z
  .object({
    id: z.any().optional(),
    brand_name: z.string().optional(),
    generic_name: z.string().optional(),
    manufacturer: z.string().optional(),
    strength: z.string().optional(),
    imprint_similarity: z.number().optional(),
    match_percentage: z.number().optional(),
  })
  .passthrough()

const BodySchema = z.object({
  results: z.array(PillSchema),
  secondaryAttributes: z
    .object({
      suspected_name: z.string().optional(),
      manufacturer: z.string().optional(),
      strength: z.string().optional(),
    })
    .default({}),
  sessionId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const input = BodySchema.safeParse(await request.json())
    if (!input.success) {
      return NextResponse.json({ error: 'Invalid rerank request' }, { status: 400 })
    }
    const { results, secondaryAttributes, sessionId } = input.data

    const rerankedResults = results.map((pill: any) => {
      let boostScore = 0

      // Boost for suspected name match
      if (secondaryAttributes.suspected_name) {
        const suspectedLower = secondaryAttributes.suspected_name.toLowerCase()
        if (
          pill.brand_name?.toLowerCase().includes(suspectedLower) ||
          pill.generic_name?.toLowerCase().includes(suspectedLower)
        ) {
          boostScore += 0.2
        }
      }

      // Boost for manufacturer match
      if (secondaryAttributes.manufacturer) {
        const manufacturerLower = secondaryAttributes.manufacturer.toLowerCase()
        if (pill.manufacturer?.toLowerCase().includes(manufacturerLower)) {
          boostScore += 0.15
        }
      }

      // Boost for strength match
      if (secondaryAttributes.strength) {
        const strengthLower = secondaryAttributes.strength.toLowerCase()
        if (pill.strength?.toLowerCase().includes(strengthLower)) {
          boostScore += 0.1
        }
      }

      // Calculate new match percentage (soft boost, don't hide candidates)
      const originalMatch = pill.match_percentage || 0.5
      const boostedMatch = Math.min(originalMatch + boostScore, 1.0)

      return {
        ...pill,
        match_percentage: boostedMatch,
        boost_applied: boostScore > 0,
      }
    })

    // Sort by boosted match percentage, then by imprint similarity
    rerankedResults.sort((a, b) => {
      if (b.match_percentage !== a.match_percentage) {
        return b.match_percentage - a.match_percentage
      }
      // Secondary sort by imprint similarity (mock implementation)
      return (b.imprint_similarity || 0) - (a.imprint_similarity || 0)
    })

    return NextResponse.json({
      results: rerankedResults,
      confidence: Math.max(...rerankedResults.map((r) => r.match_percentage)),
      searchId: sessionId,
      totalResults: rerankedResults.length,
      reranked: true,
    })
  } catch (error) {
    console.error('[rerank] API error')
    return NextResponse.json({ error: 'Internal server error during reranking' }, { status: 500 })
  }
}
