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

interface PillAttributeEditorProps {
  initialAttributes: ExtractedPillAttributes
  onSearch: (attributes: ExtractedPillAttributes) => void
  isSearching?: boolean
}

const SHAPE_OPTIONS = ["Round", "Oval", "Capsule", "Square", "Diamond", "Triangle", "Rectangular", "Other"]

const COLOR_OPTIONS = [
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

const COATING_OPTIONS = ["Uncoated", "Film-coated", "Sugar-coated", "Enteric-coated", "Unknown"]

const SCORING_OPTIONS = ["None", "Single score", "Cross score", "Multiple scores", "Unknown"]

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
            <Label htmlFor="color" className="text-card-foreground">
              Color
            </Label>
            <Select value={attributes.color || ""} onValueChange={(value) => updateAttribute("color", value)}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                {COLOR_OPTIONS.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
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
              value={attributes.size_mm || ""}
              onChange={(e) => updateAttribute("size_mm", Number.parseFloat(e.target.value) || undefined)}
              placeholder="Enter size in mm"
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coating" className="text-card-foreground">
              Coating
            </Label>
            <Select value={attributes.coating || ""} onValueChange={(value) => updateAttribute("coating", value)}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Select coating" />
              </SelectTrigger>
              <SelectContent>
                {COATING_OPTIONS.map((coating) => (
                  <SelectItem key={coating} value={coating}>
                    {coating}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Imprints */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="front-imprint" className="text-card-foreground">
              Front Imprint
            </Label>
            <Input
              id="front-imprint"
              value={attributes.front_imprint || ""}
              onChange={(e) => updateAttribute("front_imprint", e.target.value)}
              placeholder="Text, numbers, or symbols"
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="back-imprint" className="text-card-foreground">
              Back Imprint
            </Label>
            <Input
              id="back-imprint"
              value={attributes.back_imprint || ""}
              onChange={(e) => updateAttribute("back_imprint", e.target.value)}
              placeholder="Text, numbers, or symbols"
              className="bg-input border-border"
            />
          </div>
        </div>

        {/* Scoring */}
        <div className="space-y-2">
          <Label htmlFor="scoring" className="text-card-foreground">
            Scoring
          </Label>
          <Select value={attributes.scoring || ""} onValueChange={(value) => updateAttribute("scoring", value)}>
            <SelectTrigger className="bg-input border-border">
              <SelectValue placeholder="Select scoring type" />
            </SelectTrigger>
            <SelectContent>
              {SCORING_OPTIONS.map((scoring) => (
                <SelectItem key={scoring} value={scoring}>
                  {scoring}
                </SelectItem>
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
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1"
          >
            {isSearching ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search Database
              </>
            )}
          </Button>

          {isEditing && (
            <Button onClick={handleReset} variant="outline" className="border-border bg-transparent">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
