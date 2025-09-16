"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SCORING_OPTIONS, SHAPE_OPTIONS, COLOR_SINGLE_TONE, COLOR_TWO_TONE } from "@/constants/pill-options"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, AlertTriangle, Upload, Edit3, Loader2 } from "lucide-react"
import { PillUploadStep } from "./pill-upload-step"
import { PillManualStep } from "./pill-manual-step"
import type { ExtractedPillAttributes } from "@/lib/openai-vision"

interface PillAttributesStepProps {
  entryMode: "photo" | "manual"
  onComplete: (attributes: ExtractedPillAttributes) => void
  pillImages: string[]
  setPillImages: (images: string[]) => void
  isLoading?: boolean
  initialAttributes?: ExtractedPillAttributes
  showOcrAlternatives?: boolean // Added this property
}

const SIZE_BINS = ["XS", "S", "M", "L"]
const SIZES_MM = [5, 6, 7, 8, 9, 10, 12]

export function PillAttributesStep({
  entryMode,
  onComplete,
  pillImages,
  setPillImages,
  isLoading,
  initialAttributes,
}: PillAttributesStepProps) {
  const [attributes, setAttributes] = useState<ExtractedPillAttributes>(
    () => initialAttributes || { confidence: 0, reasoning: "" }
  )
  const [imprintWarning, setImprintWarning] = useState(false)
  const [ocrAlternatives, setOcrAlternatives] = useState<{ imprint?: string[] }>({})

  const handlePhotoAnalysis = (analyzedAttributes: ExtractedPillAttributes, imageUrl?: string) => {
    setAttributes(analyzedAttributes)
    if (imageUrl) {
      setPillImages([imageUrl])
    }
    // Set OCR alternatives for photo mode
    setOcrAlternatives({
      imprint: ["B10", "810", "8IO", "BIO", "20", "ZO", "2O"],
    })
  }

  const handleManualEntry = (manualAttributes: ExtractedPillAttributes) => {
    setAttributes(manualAttributes)
  }

  const handleSubmit = () => {
    if (!attributes.imprint) {
      setImprintWarning(true)
    } else {
      setImprintWarning(false)
      onComplete(attributes)
    }
  }

  const handleImprintSelect = (value: string) => {
    setAttributes((prev) => ({ ...prev, imprint: value }))
    setImprintWarning(false)
  }

  // Show upload/manual entry first if no attributes yet
  if (!attributes.imprint && !attributes.shape && !attributes.color) {
    return (
      <div className="space-y-6">
        {entryMode === "photo" ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Upload and Analyze Pill Photo</h3>
            </div>
            <PillUploadStep onComplete={handlePhotoAnalysis} />
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Edit3 className="w-5 h-5 text-secondary-foreground" />
              <h3 className="text-lg font-semibold">Enter Pill Details Manually</h3>
            </div>
            <PillManualStep onComplete={handleManualEntry} />
          </div>
        )}
      </div>
    )
  }

  // Show pill card with form fields once we have attributes
  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left: Pill Image */}
            <div className="space-y-4">
              <h3 className="font-semibold">Detected Pill</h3>
              <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {pillImages[0] ? (
                  <img
                    src={pillImages[0] || "/placeholder.svg"}
                    alt="Detected pill"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-muted-foreground text-sm text-center">
                    {entryMode === "photo" ? "Processing image..." : "Manual entry"}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Form Fields */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="font-semibold">Review and Edit Attributes</h3>

              {/* Imprint Field */}
              <div className="space-y-2">
                <Label htmlFor="imprint">Imprint</Label>
                <Input
                  id="imprint"
                  value={attributes.imprint || ""}
                  onChange={(e) => setAttributes((prev) => ({ ...prev, imprint: e.target.value }))}
                  placeholder="Enter text/numbers on pill"
                />
                {ocrAlternatives.imprint && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">OCR Alternatives:</p>
                    <div className="flex flex-wrap gap-1">
                      {ocrAlternatives.imprint.map((alt, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="cursor-pointer hover:bg-accent text-xs"
                          onClick={() => setAttributes((prev) => ({ ...prev, imprint: alt }))}
                        >
                          {alt}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {imprintWarning && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please enter the imprint for better search results.
                  </AlertDescription>
                </Alert>
              )}

              {/* Shape and Color */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Shape</Label>
                  <Select
                    value={attributes.shape || ""}
                    onValueChange={(value) => setAttributes((prev) => ({ ...prev, shape: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select shape" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHAPE_OPTIONS.map((shape) => (
                        <SelectItem key={shape} value={shape}>
                          {shape}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <Select
                    value={attributes.color || ""}
                    onValueChange={(value) => setAttributes((prev) => ({ ...prev, color: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Color</SelectItem>
                      <SelectItem value="__single" disabled>Single Tones</SelectItem>
                      {COLOR_SINGLE_TONE.map(color => (
                        <SelectItem key={color} value={color}>{color}</SelectItem>
                      ))}
                      <SelectItem value="__two" disabled>Two Tones</SelectItem>
                      {COLOR_TWO_TONE.map(color => (
                        <SelectItem key={color} value={color}>{color}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Scoring Dropdown */}
              <div className="space-y-2">
                <Label>Scoring</Label>
                <Select
                  value={attributes.scoring || "no score"}
                  onValueChange={(value) => setAttributes((prev) => ({ ...prev, scoring: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scoring" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCORING_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Size */}
              <div className="space-y-2">
                <Label>Size (optional)</Label>
                <Select
                  value={attributes.size_mm ? String(attributes.size_mm) : ""}
                  onValueChange={(value) =>
                    setAttributes((prev) => ({ ...prev, size_mm: value ? Number(value) : undefined }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size (mm)" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZES_MM.map((mm) => (
                      <SelectItem key={mm} value={String(mm)}>
                        {mm} mm
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSubmit} className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Database
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
