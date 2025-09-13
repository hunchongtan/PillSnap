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

const SIZES_MM = [5,6,7,8,9,10,12]
const shapeMap: Record<string,string> = { round:"Round", circle:"Round", oval:"Oval", oblong:"Oval", capsule:"Capsule", triangle:"Triangle", square:"Square", pentagon:"Pentagon", hexagon:"Hexagon", diamond:"Diamond", heart:"Heart", tear:"Teardrop", teardrop:"Teardrop" }
const colorMap: Record<string,string> = { white:"White","off-white":"White", beige:"Beige", black:"Black", blue:"Blue", brown:"Brown", clear:"Clear", gold:"Gold", gray:"Gray", grey:"Gray", green:"Green", maroon:"Maroon", orange:"Orange", peach:"Peach", pink:"Pink", purple:"Purple", red:"Red", tan:"Tan", yellow:"Yellow" }
const mapValue = (map:Record<string,string>, v?:string) => v ? map[v.toLowerCase().trim()] : undefined
const closestSize = (target?:number, options:number[] = SIZES_MM) => !target || target<=0 ? undefined : options.reduce((a,b)=> Math.abs(b-(target as number)) < Math.abs(a-(target as number)) ? b : a)

const DEFAULT_ATTRS = { shape: "", color: "", size_mm: 0, thickness_mm: 0, front_imprint: "", back_imprint: "", coating: "", scoring: "", notes: "" }
const ensureAttrs = (a?: { shape: string; color: string; size_mm: number; thickness_mm: number; front_imprint: string; back_imprint: string; coating: string; scoring: string; notes: string }) => ({ ...DEFAULT_ATTRS, ...(a || {}) })

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

type FieldState<T> = { value: T; isAutoFilled: boolean; isEdited: boolean }
type FormState = {
  front: FieldState<string>
  back: FieldState<string>
  shape: FieldState<string>
  color: FieldState<string>
  size: FieldState<number | undefined>
  scored: FieldState<boolean>
}

type FlowStep = 1 | 2 | 3
export function PillMultiReview({ onFlowStepChange }: { onFlowStepChange?: (step: FlowStep) => void }) {
  const { dets, processing, error, run, setDets } = usePillPipeline()
  const [showAll, setShowAll] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [forms, setForms] = useState<Record<string, FormState>>({})
  const [step, setStep] = useState<FlowStep>(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null)

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
        const scoredBool = !!(a.scoring && !["none","unclear"].includes(a.scoring.toLowerCase()))
        const frontVal = a.front_imprint && a.front_imprint !== "unclear" ? a.front_imprint : ""
        const backVal = a.back_imprint && a.back_imprint !== "unclear" ? a.back_imprint : ""
        next[d.id] = {
          front: { value: frontVal, isAutoFilled: !!frontVal, isEdited: false },
          back: { value: backVal, isAutoFilled: !!backVal, isEdited: false },
          shape: { value: normShape, isAutoFilled: !!normShape, isEdited: false },
          color: { value: normColor, isAutoFilled: !!normColor, isEdited: false },
          size: { value: sizeVal, isAutoFilled: typeof sizeVal === "number", isEdited: false },
          scored: { value: scoredBool, isAutoFilled: scoredBool, isEdited: false },
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
        setUploaded(true)
        run(f)
        setStep(2)
      }
    }
  })

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
                <div className="w-16 h-16 bg-muted rounded-full" />
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

      {error && step!==3 && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

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
          {(showAll ? dets : dets.slice(0, 3)).map((det, idx) => (
            <Card key={det.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-md rounded-2xl">
              <CardContent className="p-4 space-y-3">
                <div className="w-full aspect-square bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden flex items-center justify-center">
                  {det.previewUrl ? (
                    <img src={det.previewUrl} alt={`Pill ${idx+1}`} className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-xs text-muted-foreground">Waiting for crop…</div>
                  )}
                </div>

                {/* Form fields with autofill highlights */}
                <div className="space-y-3">
                  <Field label="Front Imprint" badge={forms[det.id]?.front.isAutoFilled && !forms[det.id]?.front.isEdited ? "Auto" : undefined} highlight={forms[det.id]?.front.isAutoFilled && !forms[det.id]?.front.isEdited ? "auto" : undefined}>
                    <Input className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm" value={forms[det.id]?.front.value || ""} onChange={(e)=> {
                      setForms(prev => ({
                        ...prev,
                        [det.id]: {
                          ...(prev[det.id] || { front:{value:"",isAutoFilled:false,isEdited:false}, back:{value:"",isAutoFilled:false,isEdited:false}, shape:{value:"",isAutoFilled:false,isEdited:false}, color:{value:"",isAutoFilled:false,isEdited:false}, size:{value:undefined,isAutoFilled:false,isEdited:false}, scored:{value:false,isAutoFilled:false,isEdited:false} }),
                          front: { value: e.target.value, isAutoFilled: false, isEdited: true },
                        }
                      }))
                      setDets(prev => prev.map(d => d.id===det.id ? { ...d, attributes: { ...ensureAttrs(d.attributes), front_imprint: e.target.value } } : d))
                    }} />
                  </Field>
                  <Field label="Back Imprint" badge={forms[det.id]?.back.isAutoFilled && !forms[det.id]?.back.isEdited ? "Auto" : undefined} highlight={forms[det.id]?.back.isAutoFilled && !forms[det.id]?.back.isEdited ? "auto" : undefined}>
                    <Input className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm" value={forms[det.id]?.back.value || ""} onChange={(e)=> {
                      setForms(prev => ({
                        ...prev,
                        [det.id]: {
                          ...(prev[det.id] || { front:{value:"",isAutoFilled:false,isEdited:false}, back:{value:"",isAutoFilled:false,isEdited:false}, shape:{value:"",isAutoFilled:false,isEdited:false}, color:{value:"",isAutoFilled:false,isEdited:false}, size:{value:undefined,isAutoFilled:false,isEdited:false}, scored:{value:false,isAutoFilled:false,isEdited:false} }),
                          back: { value: e.target.value, isAutoFilled: false, isEdited: true },
                        }
                      }))
                      setDets(prev => prev.map(d => d.id===det.id ? { ...d, attributes: { ...ensureAttrs(d.attributes), back_imprint: e.target.value } } : d))
                    }} />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Shape" badge={forms[det.id]?.shape.isAutoFilled && !forms[det.id]?.shape.isEdited ? "Auto" : undefined} highlight={forms[det.id]?.shape.isAutoFilled && !forms[det.id]?.shape.isEdited ? "auto" : undefined}>
                      <Select value={forms[det.id]?.shape.value || ""} onValueChange={(v)=> {
                        setForms(prev => ({
                          ...prev,
                          [det.id]: {
                            ...(prev[det.id] || { front:{value:"",isAutoFilled:false,isEdited:false}, back:{value:"",isAutoFilled:false,isEdited:false}, shape:{value:"",isAutoFilled:false,isEdited:false}, color:{value:"",isAutoFilled:false,isEdited:false}, size:{value:undefined,isAutoFilled:false,isEdited:false}, scored:{value:false,isAutoFilled:false,isEdited:false} }),
                            shape: { value: v, isAutoFilled: false, isEdited: true },
                          }
                        }))
                        setDets(prev => prev.map(d => d.id===det.id ? { ...d, attributes: { ...ensureAttrs(d.attributes), shape: v } } : d))
                      }}>
                        <SelectTrigger className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm"><SelectValue placeholder="Select shape"/></SelectTrigger>
                        <SelectContent>{["Round","Oval","Capsule","Square","Triangle","Diamond","Pentagon","Hexagon","Octagon","Other"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label="Color" badge={forms[det.id]?.color.isAutoFilled && !forms[det.id]?.color.isEdited ? "Auto" : undefined} highlight={forms[det.id]?.color.isAutoFilled && !forms[det.id]?.color.isEdited ? "auto" : undefined}>
                      <Select value={forms[det.id]?.color.value || ""} onValueChange={(v)=> {
                        setForms(prev => ({
                          ...prev,
                          [det.id]: {
                            ...(prev[det.id] || { front:{value:"",isAutoFilled:false,isEdited:false}, back:{value:"",isAutoFilled:false,isEdited:false}, shape:{value:"",isAutoFilled:false,isEdited:false}, color:{value:"",isAutoFilled:false,isEdited:false}, size:{value:undefined,isAutoFilled:false,isEdited:false}, scored:{value:false,isAutoFilled:false,isEdited:false} }),
                            color: { value: v, isAutoFilled: false, isEdited: true },
                          }
                        }))
                        setDets(prev => prev.map(d => d.id===det.id ? { ...d, attributes: { ...ensureAttrs(d.attributes), color: v } } : d))
                      }}>
                        <SelectTrigger className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm"><SelectValue placeholder="Select color"/></SelectTrigger>
                        <SelectContent>{["White","Yellow","Orange","Red","Pink","Purple","Blue","Green","Brown","Gray","Black","Clear","Beige","Gold","Maroon","Peach","Tan"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Size (mm)" badge={forms[det.id]?.size.isAutoFilled && !forms[det.id]?.size.isEdited ? "Auto" : undefined} highlight={forms[det.id]?.size.isAutoFilled && !forms[det.id]?.size.isEdited ? "auto" : undefined}>
                      <Select value={typeof forms[det.id]?.size.value === "number" ? String(forms[det.id]?.size.value) : ""} onValueChange={(v)=> {
                        const num = v ? Number(v) : undefined
                        setForms(prev => ({
                          ...prev,
                          [det.id]: {
                            ...(prev[det.id] || { front:{value:"",isAutoFilled:false,isEdited:false}, back:{value:"",isAutoFilled:false,isEdited:false}, shape:{value:"",isAutoFilled:false,isEdited:false}, color:{value:"",isAutoFilled:false,isEdited:false}, size:{value:undefined,isAutoFilled:false,isEdited:false}, scored:{value:false,isAutoFilled:false,isEdited:false} }),
                            size: { value: num, isAutoFilled: false, isEdited: true },
                          }
                        }))
                        setDets(prev => prev.map(d => d.id===det.id ? { ...d, attributes: { ...ensureAttrs(d.attributes), size_mm: num ? Number(num) : 0 } } : d))
                      }}>
                        <SelectTrigger className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm"><SelectValue placeholder="Select size (mm)"/></SelectTrigger>
                        <SelectContent>{SIZES_MM.map(mm => <SelectItem key={mm} value={String(mm)}>{mm} mm</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label="Scored">
                      <div className="flex items-center gap-2">
                        <Switch checked={!!forms[det.id]?.scored.value} onCheckedChange={(checked)=> {
                          setForms(prev => ({
                            ...prev,
                            [det.id]: {
                              ...(prev[det.id] || { front:{value:"",isAutoFilled:false,isEdited:false}, back:{value:"",isAutoFilled:false,isEdited:false}, shape:{value:"",isAutoFilled:false,isEdited:false}, color:{value:"",isAutoFilled:false,isEdited:false}, size:{value:undefined,isAutoFilled:false,isEdited:false}, scored:{value:false,isAutoFilled:false,isEdited:false} }),
                              scored: { value: checked, isAutoFilled: false, isEdited: true },
                            }
                          }))
                          setDets(prev => prev.map(d => d.id===det.id ? { ...d, attributes: { ...ensureAttrs(d.attributes), scoring: checked ? "1 score" : "none" } } : d))
                        }} />
                        <span className="text-xs text-muted-foreground">Has a score line</span>
                      </div>
                    </Field>
                  </div>
                </div>

                <Button disabled={det.loading} onClick={() => { setSelectedId(det.id); setStep(3) }} className="w-full">Search Database</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {step===2 && dets.length>3 && !showAll && (
        <div className="text-center">
          <Button variant="ghost" onClick={() => setShowAll(true)}>Show more</Button>
        </div>
      )}

      {step===3 && selected && (
        <div className="space-y-4">
          <h1 ref={resultsHeadingRef} tabIndex={-1} className="sr-only">Results</h1>
          <ResultsStep pill={selected} allPills={dets} onBack={() => setStep(2)} onSelectPill={(id: string) => setSelectedId(id)} />
        </div>
      )}
    </div>
  )}
