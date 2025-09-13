"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
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

const SHAPES = [
  "Round",
  "Oval",
  "Capsule",
  "Square",
  "Rectangle",
  "Triangle",
  "Diamond",
  "Pentagon",
  "Hexagon",
  "Octagon",
  "Other",
]

const COLORS = [
  "White",
  "Yellow",
  "Orange",
  "Red",
  "Pink",
  "Purple",
  "Blue",
  "Green",
  "Brown",
  "Gray",
  "Black",
  "Clear",
  "Multi-colored",
]

const DOSAGE_FORMS = [
  "Tablet",
  "Capsule",
  "Caplet",
  "Softgel",
  "Chewable",
  "Sublingual",
  "Extended-release",
  "Delayed-release",
  "Other",
]

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
  const [ocrAlternatives, setOcrAlternatives] = useState<{ front_imprint?: string[]; back_imprint?: string[] }>({})

  const handlePhotoAnalysis = (analyzedAttributes: ExtractedPillAttributes, imageUrl?: string) => {
    setAttributes(analyzedAttributes)
    if (imageUrl) {
      setPillImages([imageUrl])
    }
    // Set OCR alternatives for photo mode
    setOcrAlternatives({
      front_imprint: ["B10", "810", "8IO", "BIO"],
      back_imprint: ["20", "ZO", "2O"],
    })
  }

  const handleManualEntry = (manualAttributes: ExtractedPillAttributes) => {
    setAttributes(manualAttributes)
  }

  const handleSubmit = () => {
    if (!attributes.front_imprint && !attributes.back_imprint) {
      setImprintWarning(true)
    } else {
      setImprintWarning(false)
      onComplete(attributes)
    }
  }

  const handleImprintSelect = (field: "front_imprint" | "back_imprint", value: string) => {
    setAttributes((prev) => ({ ...prev, [field]: value }))
    setImprintWarning(false)
  }

  // Show upload/manual entry first if no attributes yet
  if (!attributes.front_imprint && !attributes.back_imprint && !attributes.shape && !attributes.color) {
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

              {/* Imprint Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="front-imprint">Front Imprint</Label>
                  <Input
                    id="front-imprint"
                    value={attributes.front_imprint || ""}
                    onChange={(e) => setAttributes((prev) => ({ ...prev, front_imprint: e.target.value }))}
                    placeholder="Enter text/numbers on front"
                  />
                  {ocrAlternatives.front_imprint && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">OCR Alternatives:</p>
                      <div className="flex flex-wrap gap-1">
                        {ocrAlternatives.front_imprint.map((alt, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="cursor-pointer hover:bg-accent text-xs"
                            onClick={() => handleImprintSelect("front_imprint", alt)}
                          >
                            {alt}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="back-imprint">Back Imprint</Label>
                  <Input
                    id="back-imprint"
                    value={attributes.back_imprint || ""}
                    onChange={(e) => setAttributes((prev) => ({ ...prev, back_imprint: e.target.value }))}
                    placeholder="Enter text/numbers on back"
                  />
                  {ocrAlternatives.back_imprint && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">OCR Alternatives:</p>
                      <div className="flex flex-wrap gap-1">
                        {ocrAlternatives.back_imprint.map((alt, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="cursor-pointer hover:bg-accent text-xs"
                            onClick={() => handleImprintSelect("back_imprint", alt)}
                          >
                            {alt}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {imprintWarning && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please enter at least one imprint (front or back) for better search results.
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
                      {SHAPES.map((shape) => (
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
                      {COLORS.map((color) => (
                        <SelectItem key={color} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Scored Toggle and Dosage Form */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="scored"
                    checked={attributes.scored || false}
                    onCheckedChange={(checked) => setAttributes((prev) => ({ ...prev, scored: checked }))}
                  />
                  <Label htmlFor="scored">Scored (has a line for splitting)</Label>
                </div>

                <div className="space-y-2">
                  <Label>Dosage Form</Label>
                  <Select
                    value={attributes.coating || ""}
                    onValueChange={(value) => setAttributes((prev) => ({ ...prev, coating: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select dosage form" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOSAGE_FORMS.map((form) => (
                        <SelectItem key={form} value={form}>
                          {form}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
