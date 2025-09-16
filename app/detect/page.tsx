"use client"

import { useCallback, useMemo, useRef, useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, ImageIcon } from "lucide-react"

// Types
export type SegmentPrediction = {
  x: number; y: number; width: number; height: number; confidence: number; class?: string; detection_id?: string
}
export type SegmentResponse = { image: { width: number; height: number }; predictions: SegmentPrediction[] }
export type CropResponse = { image: string; mimeType: string; width: number; height: number }
export type AnalyzeAttributes = { shape?: string; color?: string; size_mm?: number; thickness_mm?: number; imprint?: string; coating?: string; scoring?: string; notes?: string }
export type AnalyzeResponse = { attributes: AnalyzeAttributes }

export type Det = {
  id: string
  conf: number
  class?: string
  box: { x:number; y:number; width:number; height:number }
  cropped?: { base64: string; mimeType: string; width?: number; height?: number }
  previewUrl?: string
  attributes?: Required<AnalyzeAttributes>
  form?: {
    imprint: { value: string; isAutoFilled: boolean; isEdited: boolean }
    shape: { value: string; isAutoFilled: boolean; isEdited: boolean }
    color: { value: string; isAutoFilled: boolean; isEdited: boolean }
    size_mm: { value: number | undefined; isAutoFilled: boolean; isEdited: boolean }
    scoring: { value: string; isAutoFilled: boolean; isEdited: boolean }
  }
  loading: boolean
  error?: string
}

const shapeMap: Record<string,string> = { round:"Round", circle:"Round", oval:"Oval", oblong:"Oval", capsule:"Capsule", triangle:"Triangle", square:"Square", pentagon:"Pentagon", hexagon:"Hexagon", diamond:"Diamond", heart:"Heart", tear:"Teardrop", teardrop:"Teardrop" }
const colorMap: Record<string,string> = { white:"White","off-white":"White", beige:"Beige", black:"Black", blue:"Blue", brown:"Brown", clear:"Clear", gold:"Gold", gray:"Gray", grey:"Gray", green:"Green", maroon:"Maroon", orange:"Orange", peach:"Peach", pink:"Pink", purple:"Purple", red:"Red", tan:"Tan", yellow:"Yellow" }
const SIZES_MM = [5,6,7,8,9,10,12]
const mapValue = (map:Record<string,string>, v?:string) => v ? map[v.toLowerCase().trim()] : undefined
const closestSize = (target?:number, options:number[] = SIZES_MM) => !target || target<=0 ? undefined : options.reduce((a,b)=> Math.abs(b-target) < Math.abs(a-target) ? b : a)

export default function DetectPage() {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string|undefined>()
  const [progress, setProgress] = useState(0)
  const [dets, setDets] = useState<Det[]>([])
  const originalFileRef = useRef<File | null>(null)

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0]
    if (!f) return
    if (!f.type.startsWith("image/")) { setError("Please upload an image file"); return }
    if (f.size > 10*1024*1024) { setError("File must be < 10MB"); return }
    setError(undefined)
    originalFileRef.current = f
    runPipeline(f)
  }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] }, multiple: false })

  const runPipeline = async (file: File) => {
    setProcessing(true)
    setProgress(5)
    setDets([])

    try {
      // 1) Segment
      const form = new FormData(); form.append("file", file)
      const segRes = await fetch("/api/segment", { method: "POST", body: form })
      if (!segRes.ok) throw new Error("Segmentation failed")
      const segJson = (await segRes.json()) as SegmentResponse
      const predictions = (segJson.predictions || []).filter(p => (p.confidence ?? 0) >= 0.6)
      if (!predictions.length) throw new Error("No pills detected with confidence ≥ 0.6")
      // Convert center coords to top-left and clamp to image bounds
      const imgW = segJson.image?.width ?? 0
      const imgH = segJson.image?.height ?? 0
      const clamp = (v:number, min:number, max:number) => Math.max(min, Math.min(v, max))
      const mapped: Det[] = predictions.map((p, i) => {
        const left = Math.round(p.x - p.width/2)
        const top = Math.round(p.y - p.height/2)
        const width = Math.round(p.width)
        const height = Math.round(p.height)
        const clampedLeft = clamp(left, 0, Math.max(0, imgW - 1))
        const clampedTop = clamp(top, 0, Math.max(0, imgH - 1))
        const clampedWidth = clamp(width, 1, Math.max(1, imgW - clampedLeft))
        const clampedHeight = clamp(height, 1, Math.max(1, imgH - clampedTop))
        return {
          id: p.detection_id || String(i+1),
          conf: p.confidence ?? 0,
          class: p.class,
          box: { x: clampedLeft, y: clampedTop, width: clampedWidth, height: clampedHeight },
          loading: true,
        }
      })
      setDets(mapped)
      setProgress(25)

      // helpers
      const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => { const r = new FileReader(); r.onload = ()=> resolve((r.result as string).split(",")[1]); r.onerror = reject; r.readAsDataURL(file) })
      const originalBase64 = await toBase64(file)

      // 2) For each det: crop then analyze (sequential) but parallel across dets
      await Promise.allSettled(mapped.map(async (det, idx) => {
        try {
          // crop
          const cropRes = await fetch("/api/crop", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: originalBase64, mimeType: file.type, box: det.box, paddingPct: 0.06, isTopLeft: true })
          })
          if (!cropRes.ok) throw new Error("Crop failed")
          const cropJson = (await cropRes.json()) as CropResponse
          const previewUrl = `data:${cropJson.mimeType};base64,${cropJson.image}`

          setDets(prev => prev.map(d => d.id===det.id ? { ...d, previewUrl, cropped: { base64: cropJson.image, mimeType: cropJson.mimeType, width: cropJson.width, height: cropJson.height } } : d))

          setProgress(25 + Math.round((idx+1)/mapped.length*35))

          // analyze
          const anRes = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: cropJson.image, mimeType: cropJson.mimeType })
          })
          if (!anRes.ok) throw new Error("Analyze failed")
          const anJson = (await anRes.json()) as AnalyzeResponse
          const a = anJson.attributes || {}

          const mappedShape = mapValue(shapeMap, a.shape) || ""
          const mappedColor = mapValue(colorMap, a.color) || ""
          const sizeVal = closestSize(typeof a.size_mm === "number" ? a.size_mm : Number(a.size_mm))
          const attributes: Required<AnalyzeAttributes> = {
            shape: mappedShape,
            color: mappedColor,
            size_mm: sizeVal || 0,
            thickness_mm: typeof a.thickness_mm === "number" ? a.thickness_mm : 0,
            imprint: a.imprint && a.imprint !== "unclear" ? a.imprint : "",
            coating: a.coating || "",
            scoring: a.scoring || "",
            notes: a.notes || "",
          }

          // Initialize editable form with autofill flags
          const form = {
            imprint: { value: attributes.imprint, isAutoFilled: true, isEdited: false },
            shape: { value: attributes.shape, isAutoFilled: true, isEdited: false },
            color: { value: attributes.color, isAutoFilled: true, isEdited: false },
            size_mm: { value: sizeVal, isAutoFilled: true, isEdited: false },
            scoring: { value: attributes.scoring || "no score", isAutoFilled: !!attributes.scoring, isEdited: false },
          }

          setDets(prev => prev.map(d => d.id===det.id ? { ...d, attributes, form, loading: false } : d))
        } catch (e) {
          setDets(prev => prev.map(d => d.id===det.id ? { ...d, loading:false, error: e instanceof Error ? e.message : String(e) } : d))
        }
      }))

      setProgress(100)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processing failed")
    } finally {
      setProcessing(false)
    }
  }

  const idsCsv = dets.map(d=>d.id).join(",")
  const [showAll, setShowAll] = useState(false)

  // Field UI wrapper
  function Field({ label, badge, children, highlight }: { label: string; badge?: "Auto" | "Check"; children: React.ReactNode; highlight?: "auto" | "warn" | "error" }) {
    const ring = highlight === "auto" ? "ring-2 ring-emerald-400/60 bg-emerald-50 dark:bg-emerald-950/30" : highlight === "warn" ? "ring-2 ring-amber-400/60 bg-amber-50 dark:bg-amber-950/30" : highlight === "error" ? "ring-2 ring-rose-500/70 bg-rose-50 dark:bg-rose-950/30" : ""
    return (
      <div className={`space-y-1 transition-colors duration-150 ${ring} rounded-lg p-2`}>
        <div className="flex items-center justify-between">
          <Label className="text-neutral-800 dark:text-neutral-100">{label}</Label>
          {badge && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">{badge}</span>}
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-2 border-dashed border-border">
        <CardContent className="p-8">
          <div {...getRootProps()} className={`text-center cursor-pointer transition-colors ${isDragActive ? "text-accent" : "text-muted-foreground"}`}>
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2">Upload pill image</h3>
                <p className="text-muted-foreground mb-4">Drag and drop an image, or click to browse</p>
                <Button variant="secondary">Choose File</Button>
              </div>
              <p className="text-xs text-muted-foreground">Supports JPG, PNG, WebP • Max 10MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {processing && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Processing image…</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {error && (
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      )}

      {dets.length>0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Detected {dets.length} pill{dets.length>1?"s":""}</Badge>
        </div>
      )}

      {dets.length>0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(showAll ? dets : dets.slice(0, 4)).map((det, idx) => (
            <Card key={det.id} className="bg-card border-border">
              <CardContent className="p-4 space-y-3">
                <div className="w-full aspect-square bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden flex items-center justify-center">
                  {det.previewUrl ? (
                    <img src={det.previewUrl} alt={`Pill ${idx+1}`} className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><ImageIcon className="w-4 h-4"/>Waiting for crop…</div>
                  )}
                </div>
                {det.error && <Alert variant="destructive"><AlertDescription>{det.error}</AlertDescription></Alert>}
                {/* Editable form */}
                <div className="space-y-3">
                  <Field label="Imprint" badge={!det.form?.imprint.isEdited && det.form?.imprint.isAutoFilled ? "Auto" : undefined} highlight={!det.form?.imprint.isEdited && det.form?.imprint.isAutoFilled ? "auto" : undefined}>
                    <Input
                      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm"
                      value={det.form?.imprint.value || ""}
                      onChange={(e)=> setDets(prev => prev.map(d => d.id===det.id ? { ...d, form: { ...d.form!, imprint: { value: e.target.value, isAutoFilled: false, isEdited: true }, shape: d.form!.shape, color: d.form!.color, size_mm: d.form!.size_mm, scoring: d.form!.scoring } } : d))}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Shape" badge={!det.form?.shape.isEdited && det.form?.shape.isAutoFilled ? "Auto" : undefined} highlight={!det.form?.shape.isEdited && det.form?.shape.isAutoFilled ? "auto" : undefined}>
                      <Select value={det.form?.shape.value || ""} onValueChange={(v)=> setDets(prev => prev.map(d => d.id===det.id ? { ...d, form: { ...d.form!, shape: { value: v, isAutoFilled: false, isEdited: true }, imprint: d.form!.imprint, color: d.form!.color, size_mm: d.form!.size_mm, scoring: d.form!.scoring } } : d))}>
                        <SelectTrigger className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm"><SelectValue placeholder="Select shape"/></SelectTrigger>
                        <SelectContent>
                          {["Round","Oval","Capsule","Square","Triangle","Diamond","Pentagon","Hexagon","Octagon","Other"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Color" badge={!det.form?.color.isEdited && det.form?.color.isAutoFilled ? "Auto" : undefined} highlight={!det.form?.color.isEdited && det.form?.color.isAutoFilled ? "auto" : undefined}>
                      <Select value={det.form?.color.value || ""} onValueChange={(v)=> setDets(prev => prev.map(d => d.id===det.id ? { ...d, form: { ...d.form!, color: { value: v, isAutoFilled: false, isEdited: true }, imprint: d.form!.imprint, shape: d.form!.shape, size_mm: d.form!.size_mm, scoring: d.form!.scoring } } : d))}>
                        <SelectTrigger className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm"><SelectValue placeholder="Select color"/></SelectTrigger>
                        <SelectContent>
                          {["White","Yellow","Orange","Red","Pink","Purple","Blue","Green","Brown","Gray","Black","Clear","Beige","Gold","Maroon","Peach","Tan"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Size (mm)" badge={!det.form?.size_mm.isEdited && det.form?.size_mm.isAutoFilled ? "Auto" : undefined} highlight={!det.form?.size_mm.isEdited && det.form?.size_mm.isAutoFilled ? "auto" : undefined}>
                      <Select value={det.form?.size_mm.value ? String(det.form.size_mm.value) : ""} onValueChange={(v)=> setDets(prev => prev.map(d => d.id===det.id ? { ...d, form: { ...d.form!, size_mm: { value: v ? Number(v) : undefined, isAutoFilled: false, isEdited: true }, imprint: d.form!.imprint, shape: d.form!.shape, color: d.form!.color, scoring: d.form!.scoring } } : d))}>
                        <SelectTrigger className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm"><SelectValue placeholder="Select size (mm)"/></SelectTrigger>
                        <SelectContent>
                          {SIZES_MM.map(mm => <SelectItem key={mm} value={String(mm)}>{mm} mm</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Scoring" badge={!det.form?.scoring.isEdited && det.form?.scoring.isAutoFilled ? "Auto" : undefined} highlight={!det.form?.scoring.isEdited && det.form?.scoring.isAutoFilled ? "auto" : undefined}>
                      <Select value={det.form?.scoring.value || "no score"} onValueChange={(v)=> setDets(prev => prev.map(d => d.id===det.id ? { ...d, form: { ...d.form!, scoring: { value: v, isAutoFilled: false, isEdited: true } } } : d))}>
                        <SelectTrigger className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm"><SelectValue placeholder="Select scoring"/></SelectTrigger>
                        <SelectContent>
                          {["no score","1 score","2 scores"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </div>
                <Button
                  disabled={det.loading}
                  onClick={() => {/* legacy detect page: results routing removed */}}
                  className="w-full"
                >
                  Search Database
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {dets.length>4 && !showAll && (
        <div className="text-center">
          <Button variant="ghost" onClick={() => setShowAll(true)}>Show more</Button>
        </div>
      )}
    </div>
  )
}
