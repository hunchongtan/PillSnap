"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { MultiPillUtils, type MultiPillResults, type ClassifiedPill } from "@/lib/multi-pill-classifier"

interface InteractiveImageOverlayProps {
  imageUrl: string
  results: MultiPillResults
  onPillSelect: (pillId: number) => void
  selectedPillId?: number
}

export function InteractiveImageOverlay({
  imageUrl,
  results,
  onPillSelect,
  selectedPillId,
}: InteractiveImageOverlayProps) {
  const [hoveredPillId, setHoveredPillId] = useState<number | null>(null)
  const [imageRenderedSize, setImageRenderedSize] = useState({ width: 0, height: 0, x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const calculateImageSize = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current
      const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect()

      const imageAspectRatio = naturalWidth / naturalHeight
      const containerAspectRatio = containerWidth / containerHeight

      let renderedWidth = containerWidth
      let renderedHeight = containerHeight

      if (imageAspectRatio > containerAspectRatio) {
        renderedHeight = containerWidth / imageAspectRatio
      } else {
        renderedWidth = containerHeight * imageAspectRatio
      }

      const x = (containerWidth - renderedWidth) / 2
      const y = (containerHeight - renderedHeight) / 2

      setImageRenderedSize({ width: renderedWidth, height: renderedHeight, x, y })
    }
  }, [])

  useEffect(() => {
    calculateImageSize()
    window.addEventListener("resize", calculateImageSize)
    return () => window.removeEventListener("resize", calculateImageSize)
  }, [calculateImageSize])

  const handleImageLoad = () => {
    calculateImageSize()
  }

  const getScaledBoundingBox = (box: ClassifiedPill["boundingBox"]) => {
    if (!imageRef.current || !imageRenderedSize.width) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }
    const { naturalWidth, naturalHeight } = imageRef.current
    const scaleX = imageRenderedSize.width / naturalWidth
    const scaleY = imageRenderedSize.height / naturalHeight

    return {
      x: box.x * scaleX + imageRenderedSize.x,
      y: box.y * scaleY + imageRenderedSize.y,
      width: box.width * scaleX,
      height: box.height * scaleY,
    }
  }

  const getStatusColor = (status: ClassifiedPill["status"]) => {
    switch (status) {
      case "success":
        return "border-green-500"
      case "low-confidence":
        return "border-yellow-500"
      case "failed":
        return "border-red-500"
      default:
        return "border-gray-500"
    }
  }

  return (
    <>
      <div
        ref={containerRef}
        className="relative w-full h-[600px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg"
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Pill analysis"
          onLoad={handleImageLoad}
          className="absolute"
          style={{
            width: imageRenderedSize.width,
            height: imageRenderedSize.height,
            top: imageRenderedSize.y,
            left: imageRenderedSize.x,
          }}
        />
        {results.pillResults.map((pill) => {
          const scaledBox = getScaledBoundingBox(pill.boundingBox)
          const bestMatch = MultiPillUtils.getBestMatch(pill)
          const isSelected = pill.pillId === selectedPillId
          const isHovered = pill.pillId === hoveredPillId

          return (
            <div
              key={pill.pillId}
              className={`absolute cursor-pointer border-2 ${getStatusColor(pill.status)} transition-all duration-200 ${
                isSelected ? "bg-blue-500/40" : isHovered ? "bg-blue-500/20" : "bg-transparent"
              }`}
              style={{
                left: scaledBox.x,
                top: scaledBox.y,
                width: scaledBox.width,
                height: scaledBox.height,
              }}
              onClick={() => onPillSelect(pill.pillId)}
              onMouseEnter={() => setHoveredPillId(pill.pillId)}
              onMouseLeave={() => setHoveredPillId(null)}
            >
              {isHovered && (
                <div
                  className="absolute -top-7 left-0 whitespace-nowrap text-black font-semibold px-2 py-0.5 rounded"
                  style={{
                    textShadow: '0 0 2px #fff, 0 0 2px #fff, 1px 1px 2px #fff, -1px -1px 2px #fff',
                    background: 'rgba(255,255,255,0.01)'
                  }}
                >
                  #{pill.pillId} {bestMatch ? bestMatch.name : "Unknown"}
                </div>
              )}
            </div>
          )
        })}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
          Click on pills to select • Hover for details
        </div>
      </div>
    </>
  )
}
