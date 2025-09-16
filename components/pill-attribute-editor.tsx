"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Edit3, Search, RotateCcw } from "lucide-react"
import type { ExtractedPillAttributes } from "@/lib/openai-vision"
import { SHAPE_OPTIONS as CAN_SHAPES, COLOR_SINGLE_TONE, COLOR_TWO_TONE, SCORING_OPTIONS as CAN_SCORING } from "@/constants/pill-options"

interface PillAttributeEditorProps {
  initialAttributes: ExtractedPillAttributes
  onSearch: (attributes: ExtractedPillAttributes) => void
  isSearching?: boolean
}

const SHAPE_OPTIONS = CAN_SHAPES
// Use grouped color arrays for dropdown presentation

export function PillAttributeEditor({ initialAttributes, onSearch, isSearching = false }: PillAttributeEditorProps) {
  const [attributes, setAttributes] = useState<ExtractedPillAttributes>(initialAttributes)
  const [isEditing, setIsEditing] = useState(false)

  const handleReset = () => {
    setAttributes(initialAttributes)
    setIsEditing(false)
  }

  const handleSearch = () => {
    onSearch(attributes)
  }

  const updateAttribute = (key: keyof ExtractedPillAttributes, value: any) => {
    setAttributes((prev) => ({
      ...prev,
      [key]: value,
    }))
    setIsEditing(true)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-card-foreground flex items-center gap-2">
          <Edit3 className="w-5 h-5" />
          Pill Attributes
          {isEditing && (
            <Badge variant="secondary" className="ml-2">
              Modified
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Physical Characteristics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="shape" className="text-card-foreground">
              Shape
            </Label>
            <Select value={attributes.shape || ""} onValueChange={(value) => updateAttribute("shape", value)}>
              <SelectTrigger className="bg-input border-border">
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
            <Label htmlFor="color" className="text-card-foreground">Color</Label>
            <Select value={attributes.color || ""} onValueChange={(value) => updateAttribute("color", value)}>
              <SelectTrigger className="bg-input border-border">
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

          <div className="space-y-2">
            <Label htmlFor="size" className="text-card-foreground">
              Size (mm)
            </Label>
            <Input
              id="size"
              type="number"
              min="1"
              max="50"
              step="0.1"
              value={typeof attributes.size_mm === 'number' && attributes.size_mm > 0 ? attributes.size_mm.toFixed(1) : ""}
              onChange={(e) => {
                const v = e.target.value
                if (v === "") { updateAttribute("size_mm", undefined); return }
                const n = Number.parseFloat(v)
                updateAttribute("size_mm", Number.isFinite(n) && n > 0 ? n : undefined)
              }}
              onBlur={(e) => {
                const v = e.target.value
                if (v === "") return
                const n = Number.parseFloat(v)
                if (Number.isFinite(n) && n > 0) {
                  updateAttribute("size_mm", Math.round(n*10)/10)
                }
              }}
              placeholder="Enter size in mm"
              className="bg-input border-border"
            />
          </div>
        </div>

        {/* Imprint */}
        <div className="space-y-2">
          <Label htmlFor="imprint" className="text-card-foreground">
            Imprint
          </Label>
          <Input
            id="imprint"
            value={attributes.imprint || ""}
            onChange={(e) => updateAttribute("imprint", e.target.value)}
            placeholder="Text, numbers, or symbols"
            className="bg-input border-border"
          />
        </div>

        {/* Scoring */}
        <div className="space-y-2">
          <Label htmlFor="scoring" className="text-card-foreground">
            Scoring
          </Label>
          <Select value={attributes.scoring || "no score"} onValueChange={(value) => updateAttribute("scoring", value)}>
            <SelectTrigger className="bg-input border-border">
              <SelectValue placeholder="Select scoring type" />
            </SelectTrigger>
            <SelectContent>
              {CAN_SCORING.map((scoring) => (
                <SelectItem key={scoring} value={scoring}>{scoring}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* AI Analysis Info */}
        {attributes.reasoning && (
          <div className="space-y-2">
            <Label className="text-card-foreground">AI Analysis Notes</Label>
            <Textarea
              value={attributes.reasoning}
              readOnly
              className="bg-muted border-border text-muted-foreground text-sm resize-none"
              rows={3}
            />
          </div>
        )}

        {/* Confidence Score */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">AI Confidence:</span>
          <Badge variant={attributes.confidence > 0.7 ? "default" : "secondary"}>
            {(attributes.confidence * 100).toFixed(1)}%
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Button onClick={handleSearch} disabled={isSearching}>
            <Search className="w-4 h-4 mr-2" /> Search
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={isSearching}>
            <RotateCcw className="w-4 h-4 mr-2" /> Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
