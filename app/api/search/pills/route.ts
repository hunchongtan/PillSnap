import { type NextRequest, NextResponse } from "next/server"
import { searchPills, saveUserSearch } from "@/lib/database"
import type { ExtractedPillAttributes } from "@/lib/openai-vision"

export async function POST(request: NextRequest) {
  try {
    const { attributes, sessionId } = await request.json()

    if (!attributes) {
      return NextResponse.json({ error: "No search attributes provided" }, { status: 400 })
    }

    console.log("[v0] Starting pill database search with attributes:", attributes)

    // Search the database using the provided attributes
    const searchResults = await searchPills({
      shape: attributes.shape,
      color: attributes.color,
      front_imprint: attributes.front_imprint,
      back_imprint: attributes.back_imprint,
      size_mm: attributes.size_mm,
    })

    // Calculate confidence score based on attribute matches
    const confidenceScore = calculateSearchConfidence(attributes, searchResults)

    // Save the search to user_searches table for analytics
    const searchRecord = await saveUserSearch({
      detected_shape: attributes.shape,
      detected_color: attributes.color,
      detected_front_imprint: attributes.front_imprint,
      detected_back_imprint: attributes.back_imprint,
      detected_size_mm: attributes.size_mm,
      user_confirmed_shape: attributes.shape,
      user_confirmed_color: attributes.color,
      user_confirmed_front_imprint: attributes.front_imprint,
      user_confirmed_back_imprint: attributes.back_imprint,
      matched_pill_ids: searchResults.map((pill) => pill.id),
      confidence_score: confidenceScore,
      session_id: sessionId || generateSessionId(),
      user_agent: request.headers.get("user-agent") || undefined,
    })

    console.log("[v0] Database search complete:", {
      resultsCount: searchResults.length,
      confidence: confidenceScore,
      searchId: searchRecord.id,
    })

    return NextResponse.json({
      results: searchResults,
      confidence: confidenceScore,
      searchId: searchRecord.id,
      totalResults: searchResults.length,
    })
  } catch (error) {
    console.error("[v0] Pill search API error:", error)
    return NextResponse.json({ error: "Internal server error during pill search" }, { status: 500 })
  }
}

function calculateSearchConfidence(attributes: ExtractedPillAttributes, results: any[]): number {
  if (results.length === 0) return 0

  // Base confidence on number of matching attributes and result count
  let confidence = 0.3 // Base confidence

  // Add confidence for each matching attribute
  if (attributes.shape) confidence += 0.2
  if (attributes.color) confidence += 0.2
  if (attributes.front_imprint) confidence += 0.15
  if (attributes.back_imprint) confidence += 0.1
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
