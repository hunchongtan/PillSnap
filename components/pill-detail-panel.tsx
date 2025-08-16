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

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return <Badge className="bg-green-100 text-green-800">High Confidence</Badge>
    if (confidence >= 80) return <Badge variant="secondary">Medium Confidence</Badge>
    return <Badge variant="destructive">Low Confidence</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            {/* Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-700"
                type="button"
              >
                <span className="text-4xl leading-none font-light">×</span>
              </button>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-lg px-3 py-1">
                  Pill #{pill.pillId}
                </Badge>
                {getStatusIcon(pill.status)}
                <CardTitle className="text-xl">{bestMatch ? bestMatch.name : "Unidentified Pill"}</CardTitle>
              </div>
              {bestMatch && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Generic: {bestMatch.genericName}</span>
                  {bestMatch.brandName && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Brand: {bestMatch.brandName}</span>
                    </>
                  )}
                </div>
              )}
            </div>
            {bestMatch && (
              <div className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-4 h-4 rounded-full ${
                      bestMatch.confidence >= 90
                        ? "bg-green-500"
                        : bestMatch.confidence >= 80
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                  <span className={`text-2xl font-bold ${getConfidenceColor(bestMatch.confidence)}`}>
                    {bestMatch.confidence}%
                  </span>
                </div>
                {getConfidenceBadge(bestMatch.confidence)}
              </div>
            )}
          </div>
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
          <div className="grid md:grid-cols-2 gap-6">
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
                  <span className="font-medium">{Math.round(pill.detectionConfidence * 100)}% confidence</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {pill.detectionConfidence >= 0.8
                    ? "High quality detection"
                    : pill.detectionConfidence >= 0.6
                      ? "Moderate quality detection"
                      : "Low quality detection - manual verification recommended"}
                </p>
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
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? "default" : "outline"}>#{index + 1}</Badge>
                        <h4 className="font-semibold">{match.name}</h4>
                      </div>
                      <div className="text-sm text-gray-600">
                        {match.genericName}
                        {match.brandName && ` • ${match.brandName}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            match.confidence >= 90
                              ? "bg-green-500"
                              : match.confidence >= 80
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                        />
                        <span className={`font-semibold ${getConfidenceColor(match.confidence)}`}>
                          {match.confidence}%
                        </span>
                      </div>
                      {getConfidenceBadge(match.confidence)}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Physical Characteristics</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Imprint:</span>
                          <p className="font-medium">{match.imprint}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Shape:</span>
                          <p className="font-medium">{match.shape}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Color:</span>
                          <p className="font-medium">{match.color}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Size:</span>
                          <p className="font-medium">{match.size}</p>
                        </div>
                        {match.scoring && (
                          <div className="col-span-2">
                            <span className="text-gray-600">Scoring:</span>
                            <p className="font-medium">{match.scoring}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">Medication Information</h5>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{match.description}</p>
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
