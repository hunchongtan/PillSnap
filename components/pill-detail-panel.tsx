import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, XCircle, Pill, Info } from "lucide-react"
import { MultiPillUtils, type ClassifiedPill } from "@/lib/multi-pill-classifier"

interface PillDetailPanelProps {
  pill: ClassifiedPill
  onClose?: () => void
}

export function PillDetailPanel({ pill, onClose }: PillDetailPanelProps) {
  const bestMatch = MultiPillUtils.getBestMatch(pill)
  const allMatches = pill.identifications

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "low-confidence":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return null
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600"
    if (confidence >= 80) return "text-yellow-600"
    return "text-red-600"
  }


  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <Card>
        <CardHeader className="pb-2 relative">
          <header className="flex items-center justify-between gap-3 w-full min-w-0 flex-wrap">
            {/* Left cluster: tag, icon, title */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Badge variant="outline" className="text-xs sm:text-sm px-2 py-0.5 max-w-full truncate shrink-0">
                Pill #{pill.pillId}
              </Badge>
              {getStatusIcon(pill.status)}
              <h3 className="truncate font-semibold text-base sm:text-lg min-w-0 flex-1">{bestMatch ? bestMatch.name : "Unidentified Pill"}</h3>
            </div>
            {/* Right cluster: % badge + confidence chip, never wraps/overlaps */}
            {bestMatch && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${
                    bestMatch.confidence >= 90
                      ? "bg-green-500"
                      : bestMatch.confidence >= 80
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`} />
                  <span className={`font-bold text-xs sm:text-base ${getConfidenceColor(bestMatch.confidence)}`}>{bestMatch.confidence}%</span>
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {bestMatch.confidence >= 90 ? "High Confidence" : bestMatch.confidence >= 80 ? "Medium Confidence" : "Low Confidence"}
                </span>
              </div>
            )}
          </header>
          {/* Sub-details: generic/brand, below header, full width */}
          {bestMatch && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0 text-xs sm:text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400 break-words">Generic: {bestMatch.genericName}</span>
              {bestMatch.brandName && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600 dark:text-gray-400 break-words">Brand: {bestMatch.brandName}</span>
                </>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Detection Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Detection Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Detected Region</h4>
                <div className="flex flex-col items-start">
                  <img
                    src={pill.thumbnail}
                    alt={`Pill ${pill.pillId}`}
                    className="w-full max-w-xs h-48 object-cover rounded-lg border"
                  />
                  <Badge className="mt-2 bg-black/70 text-white">
                    Detection: {Math.round(pill.detectionConfidence * 100)}%
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Bounding Box</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">X:</span> {pill.boundingBox.x}px
                  </div>
                  <div>
                    <span className="text-gray-600">Y:</span> {pill.boundingBox.y}px
                  </div>
                  <div>
                    <span className="text-gray-600">Width:</span> {pill.boundingBox.width}px
                  </div>
                  <div>
                    <span className="text-gray-600">Height:</span> {pill.boundingBox.height}px
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Detection Quality</h4>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      pill.detectionConfidence >= 0.8
                        ? "bg-green-500"
                        : pill.detectionConfidence >= 0.6
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                  <span className="font-bold text-sm">
                    {Math.round(pill.detectionConfidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
  </Card>

      {/* All Identification Matches */}
      {allMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              All Identification Matches ({allMatches.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allMatches.map((match, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    index === 0 ? "border-blue-200 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200"
                  }`}
                >
                  {/* Responsive header: flex-wrap, no overlap */}
                  <div className="flex flex-wrap items-center gap-2 mb-3 w-full">
                    <Badge variant={index === 0 ? "default" : "outline"}>#{index + 1}</Badge>
                    <h4 className="flex-1 min-w-0 font-semibold leading-tight break-words">{match.name}</h4>
                    <span className="shrink-0 inline-flex items-center gap-1">
                      <span className={`w-3 h-3 rounded-full ${
                        match.confidence >= 90
                          ? "bg-green-500"
                          : match.confidence >= 80
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`} />
                      <span className={`font-semibold ${getConfidenceColor(match.confidence)}`}>{match.confidence}%</span>
                    </span>
                    {/* Confidence chip: inline on sm+, below on xs */}
                    <span className="w-full sm:w-auto text-xs text-muted-foreground text-right">
                      {match.confidence >= 90 ? "High Confidence" : match.confidence >= 80 ? "Medium Confidence" : "Low Confidence"}
                    </span>
                  </div>
                  {/* Subheader: generic/brand */}
                  <div className="text-sm text-gray-600 mb-2 w-full">
                    {match.genericName}
                    {match.brandName && ` • ${match.brandName}`}
                  </div>
                  {/* Responsive details grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Physical Characteristics</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Imprint:</span>
                          <p className="font-medium break-words">{match.imprint}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Shape:</span>
                          <p className="font-medium break-words">{match.shape}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Color:</span>
                          <p className="font-medium break-words">{match.color}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Size:</span>
                          <p className="font-medium break-words">{match.size}</p>
                        </div>
                        {match.scoring && (
                          <div className="col-span-2">
                            <span className="text-gray-600">Scoring:</span>
                            <p className="font-medium break-words">{match.scoring}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Medication Information</h5>
                      <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{match.description}</p>
                      <div className="flex items-center gap-2 text-sm mt-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-gray-600">FDA database match</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {pill.status === "failed" && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Identification Failed:</strong>{" "}
            {pill.error || "Could not identify this pill with confidence. Consider manual verification."}
          </AlertDescription>
        </Alert>
      )}

      {/* Low Confidence Warning */}
      {pill.status === "low-confidence" && bestMatch && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Low Confidence Match:</strong> The identification confidence is below 70%. Please verify with
            additional methods such as pharmacy records or chemical analysis before treatment.
          </AlertDescription>
        </Alert>
      )}
      
    </div>
  )
}
