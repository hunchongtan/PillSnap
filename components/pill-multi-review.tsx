"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePillPipeline } from "@/hooks/usePillPipeline"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ResultsStep } from "./results-step"
import { Textarea } from "@/components/ui/textarea"
import { Pill as PillIcon } from "lucide-react"
import { WebcamCapture } from "./webcam-capture"
import { SHAPE_OPTIONS, COLOR_SINGLE_TONE, COLOR_TWO_TONE, SCORING_OPTIONS } from "@/constants/pill-options"
import { dataURLtoFile } from '@/lib/data-url'

const SIZES_MM = [5,6,7,8,9,10,12]
const shapeMap: Record<string,string> = { round:"Round", circle:"Round", oval:"Oval", oblong:"Oval", capsule:"Capsule", triangle:"Triangle", square:"Square", pentagon:"Pentagon", hexagon:"Hexagon", diamond:"Diamond", heart:"Heart", tear:"Teardrop", teardrop:"Teardrop" }
const colorMap: Record<string,string> = { white:"White","off-white":"White", beige:"Beige", black:"Black", blue:"Blue", brown:"Brown", clear:"Clear", gold:"Gold", gray:"Gray", grey:"Gray", green:"Green", maroon:"Maroon", orange:"Orange", peach:"Peach", pink:"Pink", purple:"Purple", red:"Red", tan:"Tan", yellow:"Yellow" }
const mapValue = (map:Record<string,string>, v?:string) => v ? map[v.toLowerCase().trim()] : undefined
const closestSize = (target?:number, options:number[] = SIZES_MM) => !target || target<=0 ? undefined : options.reduce((a,b)=> Math.abs(b-(target as number)) < Math.abs(a-(target as number)) ? b : a)

const DEFAULT_ATTRS = { shape: "", color: "", size_mm: 0, thickness_mm: 0, imprint: "", scoring: "", notes: "" }
const ensureAttrs = (a?: { shape: string; color: string; size_mm: number; thickness_mm: number; imprint: string; scoring: string; notes: string }) => ({ ...DEFAULT_ATTRS, ...(a || {}) })

type FieldState<T> = { value: T; isAutoFilled: boolean; isEdited: boolean }
interface FormState {
  imprint: FieldState<string>
  shape: FieldState<string>
  color: FieldState<string>
  size: FieldState<number | undefined>
  scoring: FieldState<string>
}

function Field(
  { label, badge, children, highlight }: { label: string; badge?: "Auto" | "Check" | "AI suggested"; children: React.ReactNode; highlight?: "auto" | "warn" | "error" }
) {
  const ringClass =
    highlight === "auto"
      ? "ring-2 ring-emerald-400/60 bg-emerald-50 dark:bg-emerald-950/30"
      : highlight === "warn"
        ? "ring-2 ring-amber-400/60 bg-amber-50 dark:bg-amber-950/30"
        : highlight === "error"
          ? "ring-2 ring-rose-500/70 bg-rose-50 dark:bg-rose-950/30"
          : ""
  return (
    <div className={`space-y-1 transition-colors duration-150 ${ringClass} rounded-lg p-2`}>
      <div className="flex items-center justify-between">
        <Label className="text-neutral-800 dark:text-neutral-100">{label}</Label>
        {badge ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            {badge}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  )
}

type FlowStep = 1 | 2 | 3
export function PillMultiReview({ onFlowStepChange }: { onFlowStepChange?: (step: FlowStep) => void }) {
  const { dets, processing, error, run, setDets, updateDet } = usePillPipeline()
  // Show all detections; pagination removed
  const [showAll, setShowAll] = useState(false)
  const [lastFile, setLastFile] = useState<File | null>(null)
  const [uploaded, setUploaded] = useState(false)
  const [forms, setForms] = useState<Record<string, FormState>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string | undefined>>({})
  const [step, setStep] = useState<FlowStep>(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showWebcam, setShowWebcam] = useState(false)
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null)

  const handleCapture = (dataUrl: string) => {
    setShowWebcam(false)
    try {
  const f = dataURLtoFile(dataUrl)
  setLastFile(f)
      setUploaded(true)
      run(f)
      setStep(2)
    } catch (e) {
      console.error('Capture failed', e)
    }
  }

  // Auto-advance logic and restore step/selection from session (runs only when step===1)
  useEffect(() => {
    if (dets.length > 0 && step === 1) {
      setUploaded(true)
      let restored = false
      try {
        const raw = sessionStorage.getItem("pillFlow")
        if (raw) {
          const parsed = JSON.parse(raw) as { step?: FlowStep; selectedId?: string }
          if (parsed?.step === 3 && parsed?.selectedId && dets.some(d => d.id === parsed.selectedId)) {
            setSelectedId(parsed.selectedId)
            setStep(3)
            restored = true
          }
        }
      } catch {}
      if (!restored) setStep(2)
    }
  }, [dets.length, step])

  // Notify parent of step changes (breadcrumb/title sync)
  useEffect(() => {
    onFlowStepChange?.(step)
  }, [step, onFlowStepChange])

  // Persist flow step and selection
  useEffect(() => {
    try {
      sessionStorage.setItem("pillFlow", JSON.stringify({ step, selectedId }))
    } catch {}
  }, [step, selectedId])

  // Scroll to top and focus results heading when entering step 3
  useEffect(() => {
    if (step === 3) {
      try {
        window.scrollTo({ top: 0, behavior: "smooth" })
      } catch {}
      resultsHeadingRef.current?.focus()
    }
  }, [step])

  // Initialize per-det form state when attributes arrive
  useEffect(() => {
    setForms((prev) => {
      const next = { ...prev }
      for (const d of dets) {
        if (!d.attributes || next[d.id]) continue
        const a = ensureAttrs(d.attributes)
        const normShape = mapValue(shapeMap, a.shape) || a.shape || ""
        const normColor = mapValue(colorMap, a.color) || a.color || ""
    const sizeVal = a.size_mm ? closestSize(a.size_mm) : undefined
    const rawScoring = a.scoring
    const scoringVal = rawScoring && rawScoring !== "unclear" ? rawScoring : "no score"
    const imprintVal = a.imprint && a.imprint !== "unclear" ? a.imprint : ""
        next[d.id] = {
          imprint: { value: imprintVal, isAutoFilled: !!imprintVal, isEdited: false },
          shape: { value: normShape, isAutoFilled: !!normShape, isEdited: false },
          color: { value: normColor, isAutoFilled: !!normColor, isEdited: false },
          size: { value: sizeVal, isAutoFilled: typeof sizeVal === "number", isEdited: false },
          scoring: { value: scoringVal, isAutoFilled: true, isEdited: false },
        }
      }
      return next
    })
  }, [dets])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    onDrop: (files) => {
      const f = files[0]
      if (f) {
        setLastFile(f)
        setUploaded(true)
        run(f)
        setStep(2)
      }
    }
  })

  // Removed duplicate local dataURLtoFile & handleCapture

  const selected = useMemo(() => dets.find(d => d.id === selectedId) || null, [dets, selectedId])

  const showingReview = step === 2
  useEffect(() => {
    console.assert(!(step === 3 && showingReview), "Review should not render when in Results")
  }, [step, showingReview])

  return (
    <div className="space-y-6">

      {step===1 && !uploaded && (
        <Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-md rounded-2xl">
          <CardContent className="p-8">
            <div {...getRootProps()} className={`text-center cursor-pointer transition-colors ${isDragActive ? "text-accent" : "text-muted-foreground"}`}>
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <PillIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">Upload Loose Pill Image (Supports Multiple Pills)</h3>
                  <p className="text-muted-foreground mb-4">Drag and drop an image, or click to browse</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="secondary" className="w-full sm:w-auto">Choose File</Button>
                    <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={(e)=> { e.stopPropagation(); setShowWebcam(true) }}>Take Photo</Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Supports JPG, PNG, WebP • Max 10MB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {processing && step!==3 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Processing image…</span>
          </div>
          <Progress value={45} className="w-full" />
        </div>
      )}

      {error && step!==3 && (
        <div className="flex items-center gap-3">
          <Alert variant="destructive" className="flex-1"><AlertDescription>{error}</AlertDescription></Alert>
          <Button
            variant="secondary"
            onClick={() => {
              if (lastFile) {
                setDets([])
                setUploaded(true)
                run(lastFile)
                setStep(2)
              } else {
                setDets([])
                setUploaded(false)
                setStep(1)
              }
            }}
          >
            Try again
          </Button>
        </div>
      )}

      {step===2 && uploaded && dets.length>0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Detected {dets.length} pill{dets.length>1?"s":""}</Badge>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={() => {
            setDets([])
            try { sessionStorage.removeItem("pillPipeline:last") } catch {}
            setUploaded(false)
            setStep(1)
          }}>Replace image</Button>
        </div>
      )}

      {step===2 && dets.length>0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dets.map((det, idx) => (
            <Card key={det.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-md rounded-2xl">
              <CardContent className="p-4 space-y-3">
                <div className="w-full aspect-square bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden flex items-center justify-center">
                  {det.previewUrl ? (
                    <img src={det.previewUrl} alt={`Pill ${idx+1}`} className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-xs text-muted-foreground">Waiting for crop…</div>
                  )}
                </div>
                {det.error && (
                  <div className="flex items-center gap-2">
                    <Alert variant="destructive" className="flex-1"><AlertDescription>{det.error}</AlertDescription></Alert>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (lastFile) {
                          setDets([])
                          setUploaded(true)
                          run(lastFile)
                          setStep(2)
                        } else {
                          setDets([])
                          setUploaded(false)
                          setStep(1)
                        }
                      }}
                    >
                      Try again
                    </Button>
                  </div>
                )}

                {/* Form fields with autofill highlights */}
                <div className="space-y-3">
                  <Field label="Imprint" badge={forms[det.id]?.imprint.isAutoFilled && !forms[det.id]?.imprint.isEdited ? "AI suggested" : undefined} highlight={forms[det.id]?.imprint.isAutoFilled && !forms[det.id]?.imprint.isEdited ? "auto" : undefined}>
                    <Input
                      placeholder="Optional"
                      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm"
                      value={forms[det.id]?.imprint.value || ""}
                      onChange={(e)=> {
                      setForms(prev => ({
                        ...prev,
                        [det.id]: {
                          ...(prev[det.id] || { imprint:{value:"",isAutoFilled:false,isEdited:false}, shape:{value:"",isAutoFilled:false,isEdited:false}, color:{value:"",isAutoFilled:false,isEdited:false}, size:{value:undefined,isAutoFilled:false,isEdited:false}, scoring:{value:"no score",isAutoFilled:false,isEdited:false} }),
                          imprint: { value: e.target.value, isAutoFilled: false, isEdited: true },
                        }
                      }))
                      setDets(prev => prev.map(d => d.id===det.id ? { ...d, attributes: { ...ensureAttrs(d.attributes), imprint: e.target.value } } : d))
                      setValidationErrors(prev => ({ ...prev, [det.id]: undefined }))
                    }} />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Shape*" badge={forms[det.id]?.shape.isAutoFilled && !forms[det.id]?.shape.isEdited ? "AI suggested" : undefined} highlight={forms[det.id]?.shape.isAutoFilled && !forms[det.id]?.shape.isEdited ? "auto" : undefined}>
                      <Select value={forms[det.id]?.shape.value || ""} onValueChange={(v)=> {
                        setForms(prev => ({
                          ...prev,
                          [det.id]: {
                            ...(prev[det.id] || { front:{value:"",isAutoFilled:false,isEdited:false}, back:{value:"",isAutoFilled:false,isEdited:false}, shape:{value:"",isAutoFilled:false,isEdited:false}, color:{value:"",isAutoFilled:false,isEdited:false}, size:{value:undefined,isAutoFilled:false,isEdited:false}, scoring:{value:"no score",isAutoFilled:false,isEdited:false} }),
                            shape: { value: v, isAutoFilled: false, isEdited: true },
                          }
                        }))
                        setDets(prev => prev.map(d => d.id===det.id ? { ...d, attributes: { ...ensureAttrs(d.attributes), shape: v } } : d))
                        setValidationErrors(prev => ({ ...prev, [det.id]: undefined }))
                      }}>
                        <SelectTrigger className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm"><SelectValue placeholder="Select shape"/></SelectTrigger>
                        <SelectContent>{SHAPE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label="Color*" badge={forms[det.id]?.color.isAutoFilled && !forms[det.id]?.color.isEdited ? "AI suggested" : undefined} highlight={forms[det.id]?.color.isAutoFilled && !forms[det.id]?.color.isEdited ? "auto" : undefined}>
                      <Select value={forms[det.id]?.color.value || ""} onValueChange={(v)=> {
                        setForms(prev => ({
                          ...prev,
                          [det.id]: {
                            ...(prev[det.id] || { front:{value:"",isAutoFilled:false,isEdited:false}, back:{value:"",isAutoFilled:false,isEdited:false}, shape:{value:"",isAutoFilled:false,isEdited:false}, color:{value:"",isAutoFilled:false,isEdited:false}, size:{value:undefined,isAutoFilled:false,isEdited:false}, scoring:{value:"no score",isAutoFilled:false,isEdited:false} }),
                            color: { value: v, isAutoFilled: false, isEdited: true },
                          }
                        }))
                        setDets(prev => prev.map(d => d.id===det.id ? { ...d, attributes: { ...ensureAttrs(d.attributes), color: v } } : d))
                        setValidationErrors(prev => ({ ...prev, [det.id]: undefined }))
                      }}>
                        <SelectTrigger className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm"><SelectValue placeholder="Select color"/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any Color</SelectItem>
                          <SelectItem value="__single" disabled>Single Tones</SelectItem>
                          {COLOR_SINGLE_TONE.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          <SelectItem value="__two" disabled>Two Tones</SelectItem>
                          {COLOR_TWO_TONE.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Size (mm)" badge={forms[det.id]?.size.isAutoFilled && !forms[det.id]?.size.isEdited ? "AI suggested" : undefined} highlight={forms[det.id]?.size.isAutoFilled && !forms[det.id]?.size.isEdited ? "auto" : undefined}>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={0.1}
                        placeholder="Optional"
                        value={typeof forms[det.id]?.size.value === "number" && (forms[det.id]?.size.value as number) > 0 ? (forms[det.id]?.size.value as number).toFixed(1) : (forms[det.id]?.size.value ?? "")}
                        onChange={(e)=> {
                          const v = e.target.value
                          const num = v === "" ? undefined : Number.parseFloat(v)
                          setForms(prev => ({
                            ...prev,
                            [det.id]: {
                              ...(prev[det.id] || { front:{value:"",isAutoFilled:false,isEdited:false}, back:{value:"",isAutoFilled:false,isEdited:false}, shape:{value:"",isAutoFilled:false,isEdited:false}, color:{value:"",isAutoFilled:false,isEdited:false}, size:{value:undefined,isAutoFilled:false,isEdited:false}, scoring:{value:"no score",isAutoFilled:false,isEdited:false} }),
                              size: { value: Number.isFinite(num as number) ? (num as number) : undefined, isAutoFilled: false, isEdited: true },
                            }
                          }))
                          setDets(prev => prev.map(d => d.id===det.id ? { ...d, attributes: { ...ensureAttrs(d.attributes), size_mm: Number.isFinite(num as number) ? (num as number) : 0 } } : d))
                        }}
                        onBlur={(e)=>{
                          const v = e.target.value
                          if (v === "") return
                          const n = Number.parseFloat(v)
                          if (Number.isFinite(n)) {
                            const rounded = Math.round(n * 10) / 10
                            setForms(prev => ({
                              ...prev,
                              [det.id]: { ...(prev[det.id] as any), size: { value: rounded, isAutoFilled: false, isEdited: true } }
                            }))
                            setDets(prev => prev.map(d => d.id===det.id ? { ...d, attributes: { ...ensureAttrs(d.attributes), size_mm: rounded } } : d))
                          }
                        }}
                        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm"
                      />
                    </Field>
                    <Field label="Scoring" badge={forms[det.id]?.scoring.isAutoFilled && !forms[det.id]?.scoring.isEdited ? "AI suggested" : undefined} highlight={forms[det.id]?.scoring.isAutoFilled && !forms[det.id]?.scoring.isEdited ? "auto" : undefined}>
                      <Select value={forms[det.id]?.scoring.value || "no score"} onValueChange={(v)=> {
                        setForms(prev => ({
                          ...prev,
                          [det.id]: {
                            ...(prev[det.id] || { front:{value:"",isAutoFilled:false,isEdited:false}, back:{value:"",isAutoFilled:false,isEdited:false}, shape:{value:"",isAutoFilled:false,isEdited:false}, color:{value:"",isAutoFilled:false,isEdited:false}, size:{value:undefined,isAutoFilled:false,isEdited:false}, scoring:{value:"no score",isAutoFilled:false,isEdited:false} }),
                            scoring: { value: v, isAutoFilled: false, isEdited: true },
                          }
                        }))
                        setDets(prev => prev.map(d => d.id===det.id ? { ...d, attributes: { ...ensureAttrs(d.attributes), scoring: v } } : d))
                      }}>
                        <SelectTrigger className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm"><SelectValue placeholder="Optional"/></SelectTrigger>
                        <SelectContent>{SCORING_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                  </div>
                </div>

                <div className="space-y-3 border-t pt-3">
                  <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Additional Information (optional)</div>
                  <Field label="Possible Pill Name">
                    <Input
                      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm"
                      value={det.extra?.possibleName || ""}
                      onChange={(e) => updateDet(det.id, { extra: { possibleName: e.target.value } })}
                    />
                  </Field>
                  <Field label="Patient History / Context">
                    <Textarea
                      rows={3}
                      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm"
                      value={det.extra?.patientHistory || ""}
                      onChange={(e) => updateDet(det.id, { extra: { patientHistory: e.target.value } })}
                    />
                  </Field>
                  <Field label="Notes">
                    <Textarea
                      rows={3}
                      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm"
                      value={det.extra?.notes || ""}
                      onChange={(e) => updateDet(det.id, { extra: { notes: e.target.value } })}
                    />
                  </Field>
                </div>

                {validationErrors[det.id] && (
                  <p className="text-xs text-red-600 font-medium">{validationErrors[det.id]}</p>
                )}
                <Button
                  disabled={det.loading}
                  onClick={() => {
                    const shapeVal = forms[det.id]?.shape.value?.trim()
                    const colorVal = forms[det.id]?.color.value?.trim()
                    if (!shapeVal || !colorVal) {
                      setValidationErrors(prev => ({ ...prev, [det.id]: 'Shape and color are required to search.' }))
                      return
                    }
                    setValidationErrors(prev => ({ ...prev, [det.id]: undefined }))
                    setSelectedId(det.id)
                    setStep(3)
                  }}
                  className="w-full"
                >
                  Search Database
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Show more removed; all detections are shown at once */}

      {step===3 && selected && (
        <div className="space-y-4">
          <h1 ref={resultsHeadingRef} tabIndex={-1} className="sr-only">Results</h1>
          <ResultsStep pill={selected} allPills={dets} onBack={() => setStep(2)} onSelectPill={(id: string) => setSelectedId(id)} />
        </div>
      )}
      <WebcamCapture open={showWebcam} onClose={() => setShowWebcam(false)} onCapture={handleCapture} />
    </div>
  )}
