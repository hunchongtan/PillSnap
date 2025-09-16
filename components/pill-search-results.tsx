"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Pill, Search, ExternalLink, AlertTriangle, CheckCircle2, Image as ImageIcon } from "lucide-react"
import type { Pill as PillType } from "@/lib/database"

interface SearchResult {
  results: PillType[]
  confidence: number
  searchId: string
  totalResults: number
}

interface PillSearchResultsProps {
  searchResult: SearchResult | null
  isLoading?: boolean
  error?: string | null
}

export function PillSearchResults({ searchResult, isLoading = false, error }: PillSearchResultsProps) {
  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground">Searching database...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!searchResult) {
    return null
  }

  const { results, confidence, totalResults } = searchResult

  if (results.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <Search className="w-5 h-5" />
            No Matches Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              No pills in our database match the specified attributes. Try adjusting the search criteria or check if the
              pill information is correct.
            </p>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                If you believe this pill should be in our database, please consult with a healthcare professional for
                proper identification.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Results
            <Badge variant={confidence > 0.7 ? "default" : "secondary"} className="ml-2">
              {(confidence * 100).toFixed(0)}% match
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Found {totalResults} potential matches</span>
            <span>•</span>
            <span>Confidence: {(confidence * 100).toFixed(1)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Results Grid */}
      <div className="grid gap-4">
        {results.map((pill, index) => (
          <Card key={pill.id} className="bg-card border-border hover:border-accent transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-24 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {pill.image_url ? (
                    <img src={pill.image_url} alt={`${pill.name || pill.brand_name || "Pill"} front`} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground">{pill.name || pill.brand_name || "Unknown Medication"}</h3>
                    {pill.brand_name && pill.name && <p className="text-sm text-muted-foreground">Brand: {pill.brand_name}</p>}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-card-foreground">Shape:</span>
                      <p className="text-muted-foreground">{pill.shape || "Unknown"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-card-foreground">Color:</span>
                      <p className="text-muted-foreground">{pill.color || "Unknown"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-card-foreground">Size:</span>
                      <p className="text-muted-foreground">{pill.size_mm ? `${pill.size_mm.toFixed(1)}mm` : "Unknown"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-card-foreground">Scoring:</span>
                      <p className="text-muted-foreground">{pill.scoring || "Unknown"}</p>
                    </div>
                  </div>

                  {pill.imprint && (
                    <div className="space-y-1">
                      <span className="font-medium text-card-foreground text-sm">Imprint:</span>
                      <div className="text-sm text-muted-foreground">{pill.imprint}</div>
                    </div>
                  )}

                  {pill.manufacturer && (
                    <div className="text-sm">
                      <span className="font-medium text-card-foreground">Manufacturer:</span>
                      <span className="text-muted-foreground ml-2">{pill.manufacturer}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    {index === 0 && (
                      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Best Match
                      </Badge>
                    )}
                    <Button variant="outline" size="sm" className="border-border bg-transparent">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      More Info
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Disclaimer removed - covered by global tooltip */}
    </div>
  )
}
