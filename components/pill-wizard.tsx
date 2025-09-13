"use client"

import { useState } from "react"
import { PillAttributesStep } from "./pill-attributes-step"
import type { ExtractedPillAttributes } from "@/lib/openai-vision"

interface SearchResult {
  results: any[]
  confidence: number
  searchId: string
  totalResults: number
}

interface PillWizardProps {
  onComplete: (result: SearchResult) => void
}

export function PillWizard({ onComplete }: PillWizardProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [pillImages, setPillImages] = useState<string[]>([])

  const handleAttributesComplete = async (pillAttributes: ExtractedPillAttributes) => {
    // Perform search with extracted attributes
    setIsSearching(true)
    try {
      const response = await fetch("/api/search/pills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attributes: pillAttributes, sessionId }),
      })

      if (response.ok) {
        const result = await response.json()
        onComplete(result)
      }
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PillAttributesStep
        entryMode="photo"
        onComplete={handleAttributesComplete}
        pillImages={pillImages}
        setPillImages={setPillImages}
        isLoading={isSearching}
      />
    </div>
  )
}
