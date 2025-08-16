"use client"

import type React from "react"
import Image from "next/image"
import { useState } from "react"
import { Upload, Camera, AlertTriangle, CheckCircle, Clock, Grid, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MultiPillClassifier, type MultiPillResults, MultiPillUtils } from "@/lib/multi-pill-classifier"
import { PillDetailPanel } from "@/components/pill-detail-panel"
import { CloseX } from "@/components/close-x"
import dynamic from "next/dynamic"
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"

const WebcamCapture = dynamic(() => import("@/components/webcam-capture"), { ssr: false })
import { InteractiveImageOverlay } from "@/components/interactive-image-overlay"


export default function PillIdentifier() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showWebcam, setShowWebcam] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState<string>("")

  // Type guard for error objects
  function isErrorWithMessage(err: unknown): err is { message?: string } {
    return typeof err === 'object' && err !== null && 'message' in err;
  }
  // Single pill results (legacy)
  // const [results, setResults] = useState<PillMatch[]>([])

  // Multi-pill results (new)
  const [multiPillResults, setMultiPillResults] = useState<MultiPillResults | null>(null)
  const [showMultiResults, setShowMultiResults] = useState(false)
  const [viewMode, setViewMode] = useState<"cards" | "interactive">("cards")
  const [selectedPillId, setSelectedPillId] = useState<number | null>(null)

  const [error, setError] = useState<string | null>(null)

  const classifier = new MultiPillClassifier()

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setShowMultiResults(false)
      setError(null)
    }
  }

  // Handle photo taken from webcam
  function dataURLtoFile(dataUrl: string, filename: string) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  const handleWebcamCapture = (dataUrl: string) => {
    const file = dataURLtoFile(dataUrl, "webcam-photo.jpg");
    setImagePreview(dataUrl)
    setSelectedImage(file)
    setShowWebcam(false)
    setShowMultiResults(false)
    setError(null)
  }

  const analyzePill = async () => {
    if (!selectedImage) return

    setIsAnalyzing(true)
    setShowMultiResults(false)
    setError(null)
    setAnalysisStep("Detecting pills in image...")

    try {
      const results = await classifier.processImage(selectedImage)

      if (!results.success || results.pillCount === 0) {
        setError("No pills detected in the image. Please ensure the image is clear and contains visible pills.")
        return
      }

      // Always use multi-pill display, even for a single pill
      setMultiPillResults(results)
      setShowMultiResults(true)
      setViewMode("interactive")
    } catch (err: unknown) {
      console.error("Error analyzing pill:", err)
      setError(isErrorWithMessage(err) && typeof err.message === 'string' ? err.message : "Failed to analyze pill image. Please try again or consult a pharmacist.")
    } finally {
      setIsAnalyzing(false)
      setAnalysisStep("")
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "bg-green-500"
    if (confidence >= 80) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 90) return "High"
    if (confidence >= 80) return "Medium"
    return "Low"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Identified</Badge>
      case "low-confidence":
        return <Badge variant="secondary">Low Confidence</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handlePillSelect = (pillId: number) => {
    setSelectedPillId(selectedPillId === pillId ? null : pillId)
  }

  const getSelectedPill = () => {
    if (!multiPillResults || !selectedPillId) return null
    return multiPillResults.pillResults.find((p) => p.pillId === selectedPillId) || null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div>
              <Image
                src="/icon.svg"
                alt="PillSnap Icon"
                width={60}
                height={60}
                className="h-15 w-15"
                priority
              />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">PillSnap</h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            AI-powered medication identification
          </p>
        </div>

        {/* Upload Section */}
        <Card className="max-w-2xl mx-auto mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Pill Image
            </CardTitle>
            <CardDescription>Upload a clear image containing one or more pills for identification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                {imagePreview ? (
                  <div className="space-y-4">
                    <Image
                      src={imagePreview || "/placeholder.svg"}
                      alt="Uploaded pill"
                      width={400}
                      height={256}
                      className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Image uploaded successfully</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Camera className="h-16 w-16 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">Upload or take a pill image</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        PNG, JPG up to 10MB • Single or multiple pills
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 w-full mt-4">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="pill-upload" />
                  <label
                    htmlFor="pill-upload"
                    className="flex-1 h-10 px-4 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-ring flex items-center justify-center cursor-pointer"
                    aria-label={imagePreview ? "Change Image" : "Select Image"}
                  >
                    {imagePreview ? "Change Image" : "Select Image"}
                  </label>
                  <Dialog open={showWebcam} onOpenChange={setShowWebcam}>
                    <DialogTrigger>
                      <button
                        type="button"
                        aria-label="Take Photo"
                        className="flex-1 h-10 px-4 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-ring flex items-center justify-center"
                      >
                        <Camera className="inline-block mr-2 h-5 w-5 align-text-bottom" />
                        Take Photo
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogPrimitive.Title className="text-lg font-semibold mb-2">Take a Photo</DialogPrimitive.Title>
                      <WebcamCapture
                        onCapture={handleWebcamCapture}
                        onClose={() => setShowWebcam(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Button
                onClick={analyzePill}
                disabled={(!selectedImage && !imagePreview) || isAnalyzing}
                className="w-full bg-blue-600 text-white hover:bg-blue-700 border border-blue-700 rounded-lg"
                size="lg"
              >
  {/* Webcam modal now handled by Dialog */}
                {isAnalyzing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    {analysisStep || "Processing..."}
                  </>
                ) : (
                  <>
                    <Grid className="h-4 w-4 mr-2" />
                    AI Analysis
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {error && (
          <div className="max-w-4xl mx-auto">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {showMultiResults && multiPillResults && (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Grid className="h-5 w-5" />
                      Detection Summary
                    </CardTitle>
                    <CardDescription>{MultiPillUtils.generateSummary(multiPillResults)}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === "interactive" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("interactive")}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Interactive
                    </Button>
                    <Button
                      variant={viewMode === "cards" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("cards")}
                    >
                      <Grid className="h-4 w-4 mr-2" />
                      Cards
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{multiPillResults.pillCount}</div>
                    <div className="text-sm text-gray-600">Pills Detected</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {multiPillResults.pillResults.filter((p) => p.status === "success").length}
                    </div>
                    <div className="text-sm text-gray-600">Identified</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {multiPillResults.pillResults.filter((p) => p.status === "low-confidence").length}
                    </div>
                    <div className="text-sm text-gray-600">Low Confidence</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-600">
                      {Math.round(multiPillResults.processingTime / 1000)}s
                    </div>
                    <div className="text-sm text-gray-600">Processing Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Display */}
            {viewMode === "interactive" && imagePreview && (
              <InteractiveImageOverlay
                imageUrl={imagePreview}
                results={multiPillResults}
                onPillSelect={handlePillSelect}
                selectedPillId={selectedPillId || undefined}
              />
            )}


            {viewMode === "cards" && (
              <div className="grid gap-6">
                {multiPillResults.pillResults.map((pill) => {
                  const bestMatch = MultiPillUtils.getBestMatch(pill)

                  return (
                    <Card key={pill.pillId} className="relative">
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0">
                          <div className="space-y-2 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                              <Badge variant="outline" className="text-sm sm:text-lg px-2 sm:px-3 py-0.5 sm:py-1 max-w-full truncate">
                                Pill #{pill.pillId}
                              </Badge>
                              {getStatusBadge(pill.status)}
                              {bestMatch && <CardTitle className="text-base sm:text-xl truncate max-w-[10rem] sm:max-w-xs">{bestMatch.name}</CardTitle>}
                            </div>
                            {bestMatch && (
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0 text-xs sm:text-sm">
                                <span className="text-gray-600 dark:text-gray-400 break-words">
                                  Generic: {bestMatch.genericName}
                                </span>
                                {bestMatch.brandName && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-600 dark:text-gray-400 break-words">
                                      Brand: {bestMatch.brandName}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          {bestMatch && (
                            <div className="flex flex-col items-end min-w-0 mt-2 sm:mt-0">
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                                <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${getConfidenceColor(bestMatch.confidence)}`} />
                                <span className="font-semibold text-base sm:text-lg truncate">{bestMatch.confidence}%</span>
                              </div>
                              <div className="max-w-full">
                                <Badge
                                  variant={
                                    bestMatch.confidence >= 90
                                      ? "default"
                                      : bestMatch.confidence >= 80
                                        ? "secondary"
                                        : "destructive"
                                  }
                                  className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 max-w-full truncate"
                                >
                                  {getConfidenceText(bestMatch.confidence)} Confidence
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                          {/* Pill Thumbnail */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 dark:text-white">Detected Region</h4>
                            <div className="relative">
                              <Image
                                src={pill.thumbnail}
                                alt={`Pill ${pill.pillId}`}
                                width={256}
                                height={128}
                                className="w-full h-32 object-cover rounded-lg border"
                              />
                              <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                                {Math.round(pill.detectionConfidence * 100)}%
                              </Badge>
                            </div>
                          </div>

                          {/* Physical Characteristics */}
                          {bestMatch && (
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 dark:text-white">Physical Characteristics</h4>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Imprint:</span>
                                  <p className="font-medium">{bestMatch.imprint}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Shape:</span>
                                  <p className="font-medium">{bestMatch.shape}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Color:</span>
                                  <p className="font-medium">{bestMatch.color}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Size:</span>
                                  <p className="font-medium">{bestMatch.size}</p>
                                </div>
                                {bestMatch.scoring && (
                                  <div className="col-span-2">
                                    <span className="text-gray-600 dark:text-gray-400">Scoring:</span>
                                    <p className="font-medium">{bestMatch.scoring}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Medication Information */}
                          {bestMatch && (
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 dark:text-white">Medication Information</h4>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{bestMatch.description}</p>
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-gray-600 dark:text-gray-400">Match found in FDA database</span>
                              </div>
                            </div>
                          )}

                          {/* Error State */}
                          {pill.status === "failed" && (
                            <div className="col-span-full">
                              <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  {pill.error ||
                                    "Could not identify this pill. Consider manual verification or chemical analysis."}
                                </AlertDescription>
                              </Alert>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Detail Panel */}
            {selectedPillId && getSelectedPill() && (
              <Card className="border-blue-200">
                <CardHeader className="relative pt-3 pr-10 pb-2">
                  <CardTitle>Detailed Analysis</CardTitle>
                  {/* single close button, positioned to top-right of the header */}
                  <CloseX
                    onClick={() => setSelectedPillId(null)}
                    className="absolute top-2 right-5"
                    aria-label="Close"
                  />
                </CardHeader>
                <CardContent>
                  <PillDetailPanel pill={getSelectedPill()!} />
                </CardContent>
              </Card>
            )}

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Medical Disclaimer:</strong> All identifications are based on visual analysis and should be
                confirmed with a pharmacist before treatment. For failed or low-confidence matches, consider chemical
                analysis or manual verification.
              </AlertDescription>
            </Alert>
          </div>
        )}


      </div>
    </div>
  )
}
