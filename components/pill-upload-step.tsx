"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Camera, X, CheckCircle } from "lucide-react"
import Image from "next/image"
import { PillAttributesStep } from "./pill-attributes-step"
import type { ExtractedPillAttributes } from "@/lib/openai-vision"

interface UploadedFile {
  file: File
  preview: string
}

interface PillUploadStepProps {
  onComplete: (attributes: ExtractedPillAttributes) => void
}

export function PillUploadStep({ onComplete }: PillUploadStepProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [extractedAttributes, setExtractedAttributes] = useState<ExtractedPillAttributes | null>(null)
  const [currentStep, setCurrentStep] = useState<string>("")

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file (JPG, PNG, etc.)")
        return
      }
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
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    multiple: false,
  })

  const handleAnalyze = async () => {
    if (!uploadedFile) return

    setIsProcessing(true)
    setProgress(0)
    setError(null)

    try {
      setCurrentStep("Detecting pill boundaries...")
      setProgress(30)

      const formData = new FormData()
      formData.append("file", uploadedFile.file)

      const segmentResponse = await fetch("/api/roboflow/segment", {
        method: "POST",
        body: formData,
      })

      if (!segmentResponse.ok) {
        throw new Error("Segmentation failed")
      }

      setCurrentStep("Extracting visual features...")
      setProgress(60)

      const visionResponse = await fetch("/api/openai/analyze-pill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: await fileToBase64(uploadedFile.file),
          mimeType: uploadedFile.file.type,
        }),
      })

      if (!visionResponse.ok) {
        throw new Error("Vision analysis failed")
      }

      const visionResult = await visionResponse.json()
      setExtractedAttributes(visionResult.attributes)

      setProgress(100)
      setCurrentStep("Analysis complete!")
    } catch (err) {
      setError("Failed to process image. Please try again.")
      console.error("Processing error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64 = reader.result as string
        resolve(base64.split(",")[1])
      }
      reader.onerror = reject
    })
  }

  if (extractedAttributes) {
    return (
      <PillAttributesStep initialAttributes={extractedAttributes} onComplete={onComplete} showOcrAlternatives={true} />
    )
  }

  return (
    <div className="space-y-6">
      {!uploadedFile && (
        <Card className="bg-card border-2 border-dashed border-border hover:border-accent transition-colors">
          <CardContent className="p-8">
            <div
              {...getRootProps()}
              className={`text-center cursor-pointer transition-colors ${isDragActive ? "text-accent" : "text-muted-foreground"}`}
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
                  <Button variant="secondary">Choose File</Button>
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
                  onClick={() => setUploadedFile(null)}
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
                      <span className="text-sm text-muted-foreground">{currentStep}</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                )}

                {!isProcessing && !extractedAttributes && (
                  <Button onClick={handleAnalyze} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Camera className="w-4 h-4 mr-2" />
                    Analyze Pill
                  </Button>
                )}

                {extractedAttributes && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Analysis complete!</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
