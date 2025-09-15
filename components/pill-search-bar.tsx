"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SHAPE_OPTIONS, COLOR_SINGLE_TONE, COLOR_TWO_TONE } from "@/constants/pill-options"
import { sanitizeFilterValue } from "@/lib/filter-utils"
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
      imprint: imprint.trim() || undefined,
      shape: sanitizeFilterValue(shape),
      color: sanitizeFilterValue(color),
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const fieldBaseClasses = "bg-white text-black placeholder:text-gray-500 border border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0 dark:bg-white dark:text-black dark:placeholder:text-gray-500 dark:border-gray-300"

  return (
    <Card className="bg-white border-gray-200 dark:bg-white dark:border-gray-300 shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <Input
              placeholder="Enter Pill Imprint"
              value={imprint}
              onChange={(e) => setImprint(e.target.value)}
              onKeyPress={handleKeyPress}
              className={`text-base ${fieldBaseClasses}`}
            />
          </div>

          {/* Shape Dropdown */}
          <Select value={shape} onValueChange={setShape}>
            <SelectTrigger className={`w-full md:w-40 ${fieldBaseClasses}`}>
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
            <SelectTrigger className={`w-full md:w-52 ${fieldBaseClasses}`}>
              <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Color</SelectItem>
              <SelectItem value="__single" disabled>Single Tones</SelectItem>
              {COLOR_SINGLE_TONE.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              <SelectItem value="__two" disabled>Two Tones</SelectItem>
              {COLOR_TWO_TONE.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
