"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SHAPE_OPTIONS, COLOR_OPTIONS } from "@/constants/pill-options"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Search } from "lucide-react"

interface PillSearchBarProps {
  onSearch: (query: { imprint?: string; shape?: string; color?: string }) => void
  onCameraClick: () => void
  initialValues?: { imprint?: string; shape?: string; color?: string }
}

export function PillSearchBar({ onSearch, onCameraClick, initialValues }: PillSearchBarProps) {
  const [imprint, setImprint] = useState("")
  const [shape, setShape] = useState("any")
  const [color, setColor] = useState("any")

  useEffect(() => {
    if (initialValues) {
      setImprint(initialValues.imprint || "")
      setShape(initialValues.shape || "any")
      setColor(initialValues.color || "any")
    }
  }, [initialValues])

  const handleSearch = () => {
    onSearch({
      imprint: imprint || undefined,
      shape: shape !== "any" ? shape : undefined,
      color: color !== "any" ? color : undefined,
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <Input
              placeholder="Enter Pill Imprint"
              value={imprint}
              onChange={(e) => setImprint(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-base"
            />
          </div>

          {/* Shape Dropdown */}
          <Select value={shape} onValueChange={setShape}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Shape" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Shape</SelectItem>
              {SHAPE_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Color Dropdown */}
          <Select value={color} onValueChange={setColor}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Color</SelectItem>
              {COLOR_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleSearch} className="flex-1 md:flex-none">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" onClick={onCameraClick} className="flex-1 md:flex-none bg-transparent">
              <Camera className="w-4 h-4 mr-2" />
              Camera
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
