"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Grid3X3, List } from "lucide-react"
import Link from "next/link"

interface PillResult {
  id: string
  brand_name?: string
  generic_name?: string
  strength?: string
  imprint?: string
  color?: string
  shape?: string
  manufacturer?: string
  image_url?: string
  confidence?: number
}

interface PillResultsGridProps {
  results: PillResult[]
  isLoading?: boolean
}

export function PillResultsGrid({ results, isLoading }: PillResultsGridProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="w-full h-32 bg-muted rounded-lg mb-4"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!results || results.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground">No pills found matching your criteria.</p>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting your search parameters.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Found {results.length} result{results.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((pill) => (
            <Card key={pill.id} className="hover:shadow-md transition-shadow relative">
              {pill.confidence && (
                <div className="absolute top-3 right-3 z-10">
                  <Badge
                    className={`text-xs font-semibold ${
                      pill.confidence >= 0.8
                        ? "bg-green-500 hover:bg-green-600"
                        : pill.confidence >= 0.6
                          ? "bg-yellow-500 hover:bg-yellow-600"
                          : "bg-red-500 hover:bg-red-600"
                    } text-white`}
                  >
                    {Math.round(pill.confidence * 100)}% Match
                  </Badge>
                </div>
              )}

              <CardContent className="p-4">
                {/* Pill Image */}
                <div className="w-full h-32 bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {pill.image_url ? (
                    <img
                      src={pill.image_url || "/placeholder.svg"}
                      alt={`${pill.brand_name || pill.generic_name} pill`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground text-sm">No image</div>
                  )}
                </div>

                {/* Pill Info */}
                <div className="space-y-2">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {pill.brand_name || pill.generic_name || "Unknown"}
                    </h3>
                    {pill.strength && <p className="text-sm text-muted-foreground">{pill.strength}</p>}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {pill.imprint && (
                      <Badge variant="outline" className="text-xs">
                        {pill.imprint}
                      </Badge>
                    )}
                    {pill.color && (
                      <Badge variant="outline" className="text-xs">
                        {pill.color}
                      </Badge>
                    )}
                    {pill.shape && (
                      <Badge variant="outline" className="text-xs">
                        {pill.shape}
                      </Badge>
                    )}
                  </div>

                  {pill.manufacturer && <p className="text-xs text-muted-foreground">{pill.manufacturer}</p>}

                  <Link href={`/pill/${pill.id}`}>
                    <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((pill) => (
            <Card key={pill.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 relative">
                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {pill.image_url ? (
                      <img
                        src={pill.image_url || "/placeholder.svg"}
                        alt={`${pill.brand_name || pill.generic_name} pill`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground text-xs text-center">No image</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className="font-semibold text-foreground text-lg mb-1">
                          {pill.brand_name || pill.generic_name || "Unknown"}
                        </h3>
                        {pill.generic_name && pill.brand_name && (
                          <p className="text-sm text-muted-foreground mb-1">{pill.generic_name}</p>
                        )}
                        {pill.strength && <p className="text-sm text-muted-foreground mb-2">{pill.strength}</p>}

                        <div className="flex flex-wrap gap-2 mb-2">
                          {pill.imprint && (
                            <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                              Imprint: {pill.imprint}
                            </span>
                          )}
                          {pill.shape && (
                            <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                              {pill.shape}
                            </span>
                          )}
                          {pill.color && (
                            <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                              {pill.color}
                            </span>
                          )}
                        </div>

                        {pill.manufacturer && <p className="text-xs text-muted-foreground">{pill.manufacturer}</p>}
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {pill.confidence && (
                          <Badge
                            className={`text-xs font-semibold ${
                              pill.confidence >= 0.8
                                ? "bg-green-500 hover:bg-green-600"
                                : pill.confidence >= 0.6
                                  ? "bg-yellow-500 hover:bg-yellow-600"
                                  : "bg-red-500 hover:bg-red-600"
                            } text-white`}
                          >
                            {Math.round(pill.confidence * 100)}% Match
                          </Badge>
                        )}
                        <Link href={`/pill/${pill.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-amber-50 border-amber-200 mt-6">
        <CardContent className="p-4">
          <p className="text-sm text-amber-800 text-center">
            <strong>Important:</strong> These results are for informational purposes only. Always verify pill
            identification with a healthcare professional or pharmacist before taking any medication.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
