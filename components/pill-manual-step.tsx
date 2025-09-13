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
    front_imprint: "",
    back_imprint: "",
    size_mm: undefined,
    scored: false,
    coating: "",
    confidence: 1.0,
  }

  return <PillAttributesStep initialAttributes={emptyAttributes} onComplete={onComplete} showOcrAlternatives={false} />
}
