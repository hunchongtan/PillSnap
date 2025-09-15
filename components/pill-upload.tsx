"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Camera, X, CheckCircle, Eye } from "lucide-react"
import { WebcamCapture } from "./webcam-capture"
import { dataURLtoFile } from "@/lib/data-url"
import Image from "next/image"
import { segmentPillImage, type ProcessedPillImage } from "@/lib/roboflow"
import { extractPillAttributes, type VisionAnalysisResult, type ExtractedPillAttributes } from "@/lib/openai-vision"
import { PillAttributeEditor } from "./pill-attribute-editor"
import { PillSearchResults } from "./pill-search-results"

interface UploadedFile {
  file: File
  preview: string
}

interface SearchResult {
  results: any[]
  confidence: number
  searchId: string
  totalResults: number
}

export function PillUpload() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [segmentationResult, setSegmentationResult] = useState<ProcessedPillImage | null>(null)
  const [visionResult, setVisionResult] = useState<VisionAnalysisResult | null>(null)
  const [currentStep, setCurrentStep] = useState<string>("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [sessionId] = useState(() => `session_${new Date().toISOString()}_${Math.random().toString(36).substr(2, 9)}`)
  const [showWebcam, setShowWebcam] = useState(false)
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file (JPG, PNG, etc.)")
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB")
        return
      }

      setError(null)
      const preview = URL.createObjectURL(file)
      setUploadedFile({ file, preview })
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: false,
  })


  const handleCapture = (dataUrl: string) => {
    setShowWebcam(false)
    setCapturedPreview(dataUrl)
    const file = dataURLtoFile(dataUrl)
    setUploadedFile({ file, preview: dataUrl })
    // Optionally auto-start analysis
    setTimeout(() => {
      handleAnalyze().catch(()=>{})
    }, 50)
  }

  const handleRemoveFile = () => {
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.preview)
      setUploadedFile(null)
      setProgress(0)
      setIsProcessing(false)
      setError(null)
      setSegmentationResult(null)
      setVisionResult(null)
      setIsSearching(false)
      setSearchResult(null)
    }
  }

  const handleAnalyze = async () => {
    if (!uploadedFile) return

    setIsProcessing(true)
    setProgress(0)
    setError(null)
    setSegmentationResult(null)
    setVisionResult(null)

    try {
      setCurrentStep("Extracting visual features...")
      console.log("[handleAnalyze] Current step: Extracting visual features...")
      setProgress(50)

      const visionAnalysis = await extractPillAttributes(uploadedFile.file)
      if (!visionAnalysis || !visionAnalysis.attributes) {
        throw new Error("Invalid vision analysis response")
      }
      console.log("[handleAnalyze] Vision analysis result:", visionAnalysis)
      setVisionResult(visionAnalysis)

      setCurrentStep("Finalizing results...")
      console.log("[handleAnalyze] Current step: Finalizing results...")
      setProgress(100)
      await new Promise((resolve) => setTimeout(resolve, 500))

      console.log("[handleAnalyze] Complete analysis finished:", {
        visionAttributes: visionAnalysis.attributes,
        visionConfidence: visionAnalysis.attributes.confidence,
      })
    } catch (err) {
      setError("Failed to process image. Please try again.")
      console.error("[handleAnalyze] Processing error:", {
        message: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : "No stack trace",
      })
    } finally {
      setIsProcessing(false)
      setCurrentStep("")
    }
  }

  const handleSearch = async (attributes: ExtractedPillAttributes) => {
    setIsSearching(true)
    setError(null)
    setSearchResult(null)

    try {
      console.log("[v0] Searching database with attributes:", attributes)

      const response = await fetch("/api/search/pills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attributes,
          sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const result = await response.json()
      setSearchResult(result)

      console.log("[v0] Database search complete:", {
        resultsCount: result.totalResults,
        confidence: result.confidence,
      })
    } catch (err) {
      setError("Failed to search database. Please try again.")
      console.error("[v0] Search error:", err)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      {!uploadedFile && (
        <Card className="bg-card border-2 border-dashed border-border hover:border-accent transition-colors">
          <CardContent className="p-8">
            <div
              {...getRootProps()}
              className={`text-center cursor-pointer transition-colors ${
                isDragActive ? "text-accent" : "text-muted-foreground"
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  {isDragActive ? (
                    <Upload className="w-8 h-8 text-accent" />
                  ) : (
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">
                    {isDragActive ? "Drop your image here" : "Upload pill image"}
                  </h3>
                  <p className="text-muted-foreground mb-4">Drag and drop an image, or click to browse</p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      Choose File
                    </Button>
                    <Button type="button" variant="outline" onClick={(e) => { e.stopPropagation(); setShowWebcam(true) }}>
                      Take Photo
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Supports JPG, PNG, WebP • Max 10MB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {uploadedFile && (
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="relative">
                <Image
                  src={uploadedFile.preview || "/placeholder.svg"}
                  alt="Uploaded pill"
                  width={200}
                  height={200}
                  className="rounded-lg object-cover border border-border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full p-0"
                  onClick={handleRemoveFile}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">{uploadedFile.file.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-muted-foreground">{currentStep || "Processing image..."}</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                )}

                {segmentationResult && visionResult && !isProcessing && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Analysis complete!</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <h4 className="font-medium text-card-foreground flex items-center gap-1">
                          <Camera className="w-4 h-4" />
                          Detection Results
                        </h4>
                        <div className="text-muted-foreground space-y-1">
                          <p>Pills detected: {segmentationResult.detections.length}</p>
                          <p>Detection confidence: {(segmentationResult.confidence * 100).toFixed(1)}%</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-card-foreground flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          Visual Analysis
                        </h4>
                        <div className="text-muted-foreground space-y-1">
                          <p>Shape: {visionResult.attributes.shape || "Unknown"}</p>
                          <p>Color: {visionResult.attributes.color || "Unknown"}</p>
                          <p>Analysis confidence: {(visionResult.attributes.confidence * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>

                    {visionResult.attributes.imprint && (
                      <div className="text-sm">
                        <span className="font-medium text-card-foreground">Imprint: </span>
                        <span className="text-muted-foreground">{visionResult.attributes.imprint}</span>
                      </div>
                    )}
                  </div>
                )}

                {!isProcessing && progress === 0 && (
                  <Button onClick={handleAnalyze} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Camera className="w-4 h-4 mr-2" />
                    Analyze Pill
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {visionResult && !isProcessing && (
        <PillAttributeEditor
          initialAttributes={visionResult.attributes}
          onSearch={handleSearch}
          isSearching={isSearching}
        />
      )}

      <PillSearchResults searchResult={searchResult} isLoading={isSearching} error={error} />
      <WebcamCapture open={showWebcam} onClose={() => setShowWebcam(false)} onCapture={handleCapture} />
    </div>
  )
}
