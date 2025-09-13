import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { results, secondaryAttributes, sessionId } = await request.json()

    if (!results || !Array.isArray(results)) {
      return NextResponse.json({ error: "No results provided for reranking" }, { status: 400 })
    }

    console.log("[v0] Reranking results with secondary attributes:", secondaryAttributes)

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

    console.log("[v0] Reranking complete:", {
      originalCount: results.length,
      rerankedCount: rerankedResults.length,
      boostedItems: rerankedResults.filter((r) => r.boost_applied).length,
    })

    return NextResponse.json({
      results: rerankedResults,
      confidence: Math.max(...rerankedResults.map((r) => r.match_percentage)),
      searchId: sessionId,
      totalResults: rerankedResults.length,
      reranked: true,
    })
  } catch (error) {
    console.error("[v0] Rerank API error:", error)
    return NextResponse.json({ error: "Internal server error during reranking" }, { status: 500 })
  }
}
