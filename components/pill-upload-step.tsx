"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Camera, X, CheckCircle } from "lucide-react"
import { WebcamCapture } from "./webcam-capture"
import { dataURLtoFile } from "@/lib/data-url"
import Image from "next/image"
import { PillAttributesStep } from "./pill-attributes-step"
import type { ExtractedPillAttributes } from "@/lib/openai-vision"
import type { RoboflowResponse } from "@/lib/roboflow"

type CropResponse = { image: string; mimeType: string; width: number; height: number }

type AnalyzeAttributes = {
  shape?: string
  color?: string
  size_mm?: number
  thickness_mm?: number
  imprint?: string
  scoring?: string
  notes?: string
}

type AnalyzeResponse = { attributes: AnalyzeAttributes }

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
  const [showWebcam, setShowWebcam] = useState(false)
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null)

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


  const handleCapture = async (dataUrl: string) => {
    try {
      setShowWebcam(false)
      setCapturedPreview(dataUrl)
      const file = dataURLtoFile(dataUrl)
      const preview = dataUrl
      setUploadedFile({ file, preview })
      // auto start analyze after short delay to allow state commit
      setTimeout(() => { handleAnalyze().catch(()=>{}) }, 50)
    } catch (e) {
      console.error('Capture handling failed', e)
    }
  }

  const handleAnalyze = async () => {
    if (!uploadedFile) return

    setIsProcessing(true)
    setProgress(0)
    setError(null)

    try {
      setCurrentStep("Detecting pill boundaries...")
      setProgress(20)

      const formData = new FormData()
      formData.append("file", uploadedFile.file)

      const segmentResponse = await fetch("/api/segment", {
        method: "POST",
        body: formData,
      })
      if (!segmentResponse.ok) throw new Error("Segmentation failed")
      const segmentJson = (await segmentResponse.json()) as RoboflowResponse
      const preds = segmentJson.predictions || []
      if (!preds.length) throw new Error("No pill detected")
      const best = preds.slice().sort((a,b)=> (b.confidence||0) - (a.confidence||0))[0] || preds[0]

      setCurrentStep("Cropping detected pill...")
      setProgress(50)

      const base64Original = await fileToBase64(uploadedFile.file)
      const cropResponse = await fetch("/api/crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Original,
          mimeType: uploadedFile.file.type,
          box: { x: best.x, y: best.y, width: best.width, height: best.height },
          paddingPct: 0.06,
        }),
      })
      if (!cropResponse.ok) throw new Error("Cropping failed")
      const cropJson = (await cropResponse.json()) as CropResponse
      const previewUrl = `data:${cropJson.mimeType};base64,${cropJson.image}`

      // show preview by reusing pillImages channel via PillAttributesStep later
      // For this component preview, update uploadedFile.preview to cropped preview
      setUploadedFile((prev) => (prev ? { ...prev, preview: previewUrl } : prev))

      setCurrentStep("Analyzing cropped image...")
      setProgress(70)

      const visionResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: cropJson.image,
          mimeType: cropJson.mimeType,
        }),
      })
      if (!visionResponse.ok) throw new Error("Vision analysis failed")
      const visionResult = (await visionResponse.json()) as AnalyzeResponse

      // Map attributes to UI-friendly values
      const attrs = visionResult.attributes || {}

      const shapeMap: Record<string,string> = { "round":"Round","circle":"Round","oval":"Oval","capsule":"Capsule","oblong":"Oval","triangle":"Triangle","square":"Square","pentagon":"Pentagon","hexagon":"Hexagon","diamond":"Diamond","heart":"Other","tear":"Other","teardrop":"Other" }
      const colorMap: Record<string,string> = { "white":"White","off-white":"White","beige":"Beige","black":"Black","blue":"Blue","brown":"Brown","clear":"Clear","gold":"Gold","gray":"Gray","green":"Green","maroon":"Maroon","orange":"Orange","peach":"Peach","pink":"Pink","purple":"Purple","red":"Red","tan":"Tan","yellow":"Yellow" }

      const mapValue = (map: Record<string,string>, v?: string) => {
        if (!v) return undefined
        const k = v.toLowerCase().trim()
        return map[k]
      }

    const mappedShape = mapValue(shapeMap, attrs.shape) || ""
    const mappedColor = mapValue(colorMap, attrs.color) || ""
    const rawSize = typeof attrs.size_mm === "number" ? attrs.size_mm : Number(attrs.size_mm)
    const sizeVal = Number.isFinite(rawSize) && rawSize>0 ? Math.round(rawSize*10)/10 : undefined

  // No coating/dosage form

      setExtractedAttributes({
        imprint: attrs.imprint && attrs.imprint !== "unclear" ? attrs.imprint : "",
        shape: mappedShape,
        color: mappedColor,
        size_mm: sizeVal,
        scoring: attrs.scoring,
        confidence: 0,
        reasoning: "",
      })

      setProgress(100)
      setCurrentStep("Analysis complete!")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process image. Please try again.")
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
      <PillAttributesStep
        initialAttributes={extractedAttributes}
        onComplete={onComplete}
        showOcrAlternatives={true}
        entryMode="photo"
        pillImages={[uploadedFile?.preview || ""]}
        setPillImages={() => {}}
      />
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
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="secondary" className="w-full sm:w-auto">Choose File</Button>
                    <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={(e) => { e.stopPropagation(); setShowWebcam(true) }}>Take Photo</Button>
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
      <WebcamCapture open={showWebcam} onClose={() => setShowWebcam(false)} onCapture={handleCapture} />
    </div>
  )
}
