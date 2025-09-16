"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Grid3X3, List } from "lucide-react"
import Link from "next/link"
import clsx from "clsx"

interface PillResult {
  id: string
  name?: string
  brand_name?: string
  manufacturer?: string
  imprint?: string
  shape?: string
  color?: string
  size_mm?: number
  scoring?: string
  image_url?: string
  back_image_url?: string
  confidence?: number
}

interface PillResultsGridProps {
  results: PillResult[]
  isLoading?: boolean
}

export function PillResultsGrid({ results, isLoading }: PillResultsGridProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const computeAverageConfidence = useMemo(() => {
    return (rs: Array<{ confidence?: number }>) => {
      const vals = rs.map(r => r.confidence).filter((v): v is number => typeof v === 'number' && isFinite(v))
      if (!vals.length) return null
      return (vals.reduce((a,b)=>a+b,0) / vals.length) * 100
    }
  }, [])

  const avgConf = useMemo(() => computeAverageConfidence(results || []), [computeAverageConfidence, results])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
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
      <Card className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 text-center py-12">
        <CardContent>
          <p className="text-muted-foreground">No pills found matching your criteria.</p>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting your search parameters.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Found {results.length} result{results.length === 1 ? '' : 's'}
          </div>
          {avgConf !== null && (
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              {`Average confidence ${avgConf.toFixed(avgConf >= 99 ? 0 : 1)}%`}
            </div>
          )}
        </div>
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
            <Card key={pill.id} className="hover:shadow-md transition-shadow relative rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <CardContent className="p-4">
                {/* Pill Images */}
                <div className="w-full mb-4">
                  {pill.image_url || pill.back_image_url ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        {pill.image_url ? (
                          <img src={pill.image_url} alt={`${pill.name || pill.brand_name || "Pill"} front`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-muted-foreground text-xs">No front</div>
                        )}
                      </div>
                      <div className="h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        {pill.back_image_url ? (
                          <img src={pill.back_image_url} alt={`${pill.name || pill.brand_name || "Pill"} back`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-muted-foreground text-xs">No back</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-muted-foreground text-sm">No images</div>
                    </div>
                  )}
                </div>

                {/* Pill Info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        {pill.name || pill.brand_name || "Unknown"}
                      </h3>
                      {pill.brand_name && pill.name && (
                        <p className="text-xs text-muted-foreground">Brand: {pill.brand_name}</p>
                      )}
                    </div>
                    {typeof pill.confidence === 'number' && (
                      (() => {
                        const conf = pill.confidence * 100
                        const badgeClasses = clsx(
                          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                          conf >= 80 ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-800/60"
                            : conf >= 60 ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:ring-amber-800/60"
                            : "bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700"
                        )
                        return <span className={badgeClasses}>{conf.toFixed(conf >= 99 ? 0 : 1)}%</span>
                      })()
                    )}
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
                    {typeof pill.size_mm === 'number' && (
                      <Badge variant="outline" className="text-xs">{pill.size_mm.toFixed(1)} mm</Badge>
                    )}
                    {pill.scoring && (
                      <Badge variant="outline" className="text-xs">{pill.scoring}</Badge>
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
            <Card key={pill.id} className="hover:shadow-md transition-shadow rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 relative">
                  <div className="w-32 flex gap-2 flex-shrink-0">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      {pill.image_url ? (
                        <img src={pill.image_url} alt={`${pill.name || pill.brand_name || "Pill"} front`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-muted-foreground text-[10px] text-center px-1">No front</div>
                      )}
                    </div>
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      {pill.back_image_url ? (
                        <img src={pill.back_image_url} alt={`${pill.name || pill.brand_name || "Pill"} back`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-muted-foreground text-[10px] text-center px-1">No back</div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                          {pill.name || pill.brand_name || "Unknown"}
                        </h3>
                        {pill.brand_name && pill.name && (
                          <p className="text-xs text-muted-foreground mb-2">Brand: {pill.brand_name}</p>
                        )}

                        <div className="flex flex-wrap gap-2 mb-2">
                          {pill.imprint && (
                            <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                              Imprint: {pill.imprint}
                            </span>
                          )}
                          {pill.shape && (<span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">{pill.shape}</span>)}
                          {pill.color && (<span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">{pill.color}</span>)}
                          {typeof pill.size_mm === 'number' && (<span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">{pill.size_mm.toFixed(1)} mm</span>)}
                          {pill.scoring && (<span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">{pill.scoring}</span>)}
                        </div>

                        {pill.manufacturer && <p className="text-xs text-muted-foreground">{pill.manufacturer}</p>}
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {typeof pill.confidence === 'number' && (() => {
                          const conf = pill.confidence * 100
                          const badgeClasses = clsx(
                            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                            conf >= 80 ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-800/60"
                              : conf >= 60 ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:ring-amber-800/60"
                              : "bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700"
                          )
                          return <span className={badgeClasses}>{conf.toFixed(conf >= 99 ? 0 : 1)}%</span>
                        })()}
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

      {/* Disclaimer block removed - covered by global tooltip */}
    </div>
  )
}
