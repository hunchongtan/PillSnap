"use client"

import { PillAttributesStep } from "./pill-attributes-step"
import type { ExtractedPillAttributes } from "@/lib/openai-vision"

interface PillManualStepProps {
  onComplete: (attributes: ExtractedPillAttributes) => void
}

export function PillManualStep({ onComplete }: PillManualStepProps) {
  const emptyAttributes: ExtractedPillAttributes = {
    shape: "",
    color: "",
    imprint: "",
    size_mm: 0,
  scoring: "no score",
    confidence: 0,
    reasoning: "",
  }

  return (
    <PillAttributesStep
      initialAttributes={emptyAttributes}
      onComplete={onComplete}
      showOcrAlternatives={false}
      entryMode="manual"
      pillImages={[]}
      setPillImages={() => {}}
    />
  )
}
