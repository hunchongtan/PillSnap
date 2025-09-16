"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, CheckCircle, AlertCircle, Camera, ChevronDown } from "lucide-react"
import { WebcamCapture } from "./webcam-capture"
import { dataURLtoFile } from "@/lib/data-url"
import { SHAPE_OPTIONS, COLOR_SINGLE_TONE, COLOR_TWO_TONE, SCORING_OPTIONS } from "@/constants/pill-options"

export function PillContribute() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [frontImage, setFrontImage] = useState<File | null>(null)
  const [backImage, setBackImage] = useState<File | null>(null)
  const [frontPreview, setFrontPreview] = useState<string | null>(null)
  const [backPreview, setBackPreview] = useState<string | null>(null)
  const [showWebcam, setShowWebcam] = useState<null | 'front' | 'back'>(null)
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    brandName: "",
    manufacturer: "",
    imprint: "",
    shape: "",
    color: "",
    sizeMm: "",
    scoring: "",
    commonUse: "",
    market: "",
    notes: "",
    approvalStatus: "",
  })

  const handleImageUpload = (file: File, side: "front" | "back") => {
    if (side === "front") {
      setFrontImage(file)
      if (frontPreview) URL.revokeObjectURL(frontPreview)
      setFrontPreview(URL.createObjectURL(file))
    } else {
      setBackImage(file)
      if (backPreview) URL.revokeObjectURL(backPreview)
      setBackPreview(URL.createObjectURL(file))
    }
  }

  // Cleanup previews
  useEffect(() => () => {
    if (frontPreview) URL.revokeObjectURL(frontPreview)
    if (backPreview) URL.revokeObjectURL(backPreview)
  }, [frontPreview, backPreview])


  const handleCapture = (dataUrl: string) => {
    if (!showWebcam) return
    const file = dataURLtoFile(dataUrl, `${showWebcam}-capture.jpg`)
    handleImageUpload(file, showWebcam)
    setShowWebcam(null)
    // focus returns to triggering button after dialog close
    setTimeout(() => lastTriggerRef.current?.focus(), 50)
  }

  // Using canonical option sets imported from constants

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newFieldErrors: Record<string, string> = {}
    if (!frontImage) newFieldErrors.frontImage = 'Front image is required'
    if (!formData.name) newFieldErrors.name = 'Name is required'
    if (!formData.brandName) newFieldErrors.brandName = 'Brand name is required'
    if (!formData.manufacturer) newFieldErrors.manufacturer = 'Manufacturer is required'
    if (!formData.imprint) newFieldErrors.imprint = 'Imprint is required'
    if (!formData.shape) newFieldErrors.shape = 'Shape is required'
    if (!formData.color) newFieldErrors.color = 'Color is required'
    if (formData.shape && !SHAPE_OPTIONS.includes(formData.shape as any)) newFieldErrors.shape = 'Invalid shape value'
    if (formData.color && ![...COLOR_SINGLE_TONE, ...COLOR_TWO_TONE].includes(formData.color as any)) newFieldErrors.color = 'Invalid color value'
    if (!formData.scoring) newFieldErrors.scoring = 'Scoring is required'
    if (formData.scoring && !SCORING_OPTIONS.includes(formData.scoring as any)) newFieldErrors.scoring = 'Invalid scoring selection'
    if (!formData.commonUse) newFieldErrors.commonUse = 'Common use is required'
  if (formData.sizeMm && isNaN(Number(formData.sizeMm))) newFieldErrors.sizeMm = 'Size must be a number (mm)'

    setFieldErrors(newFieldErrors)
    if (Object.keys(newFieldErrors).length > 0) {
      setError(null)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formDataToSend = new FormData()
      if (frontImage) {
        formDataToSend.append("frontImage", frontImage)
      }
      if (backImage) {
        formDataToSend.append("backImage", backImage)
      }

      // Map to API expected keys
      formDataToSend.append('name', formData.name)
      formDataToSend.append('brandName', formData.brandName)
      formDataToSend.append('manufacturer', formData.manufacturer)
      formDataToSend.append('imprint', formData.imprint)
      formDataToSend.append('shape', formData.shape)
      formDataToSend.append('color', formData.color)
      formDataToSend.append('sizeMm', formData.sizeMm)
      formDataToSend.append('scoring', formData.scoring)
      formDataToSend.append('commonUse', formData.commonUse)
      formDataToSend.append('market', formData.market)
      formDataToSend.append('notes', formData.notes)
      formDataToSend.append('approvalStatus', formData.approvalStatus)

      const response = await fetch("/api/contribute", {
        method: "POST",
        body: formDataToSend,
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to submit contribution")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
          <p className="text-muted-foreground">
            Your pill contribution has been submitted for review. It will be published after approval by our team.
          </p>
        </CardContent>
      </Card>
    )
  }

  const ImageField = ({
    id,
    label,
    required,
    preview,
    onBrowse,
    onCapture,
    onRemove,
    optionalNote,
  }: {
    id: string
    label: string
    required?: boolean
    preview: string | null
    onBrowse: () => void
    onCapture: (btn: HTMLButtonElement) => void
    onRemove: () => void
    optionalNote?: string
  }) => {
    const boxRef = useRef<HTMLDivElement | null>(null)
    const describe = `${label} ${required ? 'required' : 'optional'}; drag and drop image or use buttons.`
    const onDropHandler = (e: React.DragEvent) => {
      e.preventDefault(); e.stopPropagation()
      const f = e.dataTransfer.files?.[0]
      if (f && f.type.startsWith('image/')) handleImageUpload(f, id.startsWith('front') ? 'front' : 'back')
    }
    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }

    return (
      <div role="group" aria-labelledby={`${id}-label`} ref={boxRef} className="space-y-2">
        <Label id={`${id}-label`} htmlFor={id} className={`font-medium text-sm flex items-center gap-1 ${required ? 'text-foreground' : 'text-muted-foreground'}`}>
          {label}{required && <span className="text-red-500">*</span>} {!required && optionalNote && <span className="text-xs font-normal">({optionalNote})</span>}
        </Label>
        <div
          className={`relative rounded-md border-2 border-dashed transition-colors w-full h-44 flex flex-col items-center justify-center overflow-hidden p-5 text-center select-none ${required ? 'border-muted-foreground/50 bg-muted/20' : 'border-muted-foreground/25 bg-muted/10'} ${required ? 'hover:border-muted-foreground/70' : 'hover:border-muted-foreground/50'}`}
          aria-label={describe}
          onDragOver={onDragOver}
          onDrop={onDropHandler}
        >
          {preview ? (
            <img src={preview} alt={`${label} preview`} className="w-full h-full object-cover rounded" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-7 h-7 text-muted-foreground" />
              <p className="text-xs font-medium">Drag & drop or choose</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            size="sm"
            variant={required ? 'secondary' : 'outline'}
            className="h-9 text-xs"
            onClick={() => { onBrowse(); }}
          >
            Choose File
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 text-xs"
            onClick={(e) => { lastTriggerRef.current = e.currentTarget; onCapture(e.currentTarget) }}
          >
            <Camera className="w-3 h-3 mr-1" /> Take Photo
          </Button>
          {preview && (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-9 text-xs"
                onClick={() => { onBrowse(); }}
                aria-label={`Replace ${label}`}
              >
                Replace
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-9 text-xs text-destructive"
                onClick={onRemove}
                aria-label={`Remove ${label}`}
              >
                Remove
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Contribute Pill Images</CardTitle>
        <p className="text-muted-foreground">
          Help improve our database by contributing high-quality pill images and information.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Uploads */}
          <div className="grid md:grid-cols-2 gap-6">
            <input
              id="front-image"
              type="file"
              accept="image/*"
              capture="environment"
              required
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'front')}
              className="hidden"
            />
            <input
              id="back-image"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'back')}
              className="hidden"
            />
            <ImageField
              id="front-image"
              label="Front Image"
              required
              preview={frontPreview}
              onBrowse={() => document.getElementById('front-image')?.click()}
              onCapture={(btn) => { lastTriggerRef.current = btn; setShowWebcam('front') }}
              onRemove={() => { setFrontImage(null); if (frontPreview) { URL.revokeObjectURL(frontPreview); setFrontPreview(null) } }}
            />
            {fieldErrors.frontImage && <p className="text-xs text-destructive mt-1 col-span-1">{fieldErrors.frontImage}</p>}
            <ImageField
              id="back-image"
              label="Back Image"
              optionalNote="Optional"
              preview={backPreview}
              onBrowse={() => document.getElementById('back-image')?.click()}
              onCapture={(btn) => { lastTriggerRef.current = btn; setShowWebcam('back') }}
              onRemove={() => { setBackImage(null); if (backPreview) { URL.revokeObjectURL(backPreview); setBackPreview(null) } }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG, WebP • Max 10MB</p>

          {/* Form Fields */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Acetaminophen 325mg"
              />
              {fieldErrors.name && <p className="text-xs text-destructive mt-1">{fieldErrors.name}</p>}
            </div>

            <div>
              <Label htmlFor="brandName">Brand Name <span className="text-red-500">*</span></Label>
              <Input
                id="brandName"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                placeholder="e.g., Tylenol"
              />
              {fieldErrors.brandName && <p className="text-xs text-destructive mt-1">{fieldErrors.brandName}</p>}
            </div>

            <div>
              <Label htmlFor="manufacturer">Manufacturer <span className="text-red-500">*</span></Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="e.g., Johnson & Johnson"
              />
              {fieldErrors.manufacturer && <p className="text-xs text-destructive mt-1">{fieldErrors.manufacturer}</p>}
            </div>

            <div>
              <Label htmlFor="imprint">Imprint <span className="text-red-500">*</span></Label>
              <Input
                id="imprint"
                value={formData.imprint}
                onChange={(e) => setFormData({ ...formData, imprint: e.target.value })}
                placeholder="e.g., ADVIL, L544"
              />
              {fieldErrors.imprint && <p className="text-xs text-destructive mt-1">{fieldErrors.imprint}</p>}
            </div>

            <div>
              <Label htmlFor="shape">Shape <span className="text-red-500">*</span></Label>
              <Select value={formData.shape} onValueChange={(value) => setFormData({ ...formData, shape: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shape" />
                </SelectTrigger>
                <SelectContent>
                  {SHAPE_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.shape && <p className="text-xs text-destructive mt-1">{fieldErrors.shape}</p>}
            </div>

            <div>
              <Label htmlFor="color">Color <span className="text-red-500">*</span></Label>
              <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__single" disabled>Single Tones</SelectItem>
                  {COLOR_SINGLE_TONE.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  <SelectItem value="__two" disabled>Two Tones</SelectItem>
                  {COLOR_TWO_TONE.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              {fieldErrors.color && <p className="text-xs text-destructive mt-1">{fieldErrors.color}</p>}
            </div>

            <div>
              <Label htmlFor="sizeMm">Size (mm)</Label>
              <Input
                id="sizeMm"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.1}
                value={formData.sizeMm}
                onChange={(e) => setFormData({ ...formData, sizeMm: e.target.value })}
                onBlur={(e) => {
                  const v = e.target.value
                  if (v === "") return
                  const n = Number.parseFloat(v)
                  if (Number.isFinite(n) && n > 0) {
                    const rounded = (Math.round(n * 10) / 10).toFixed(1)
                    setFormData({ ...formData, sizeMm: rounded })
                  }
                }}
                placeholder="e.g., 11.0"
              />
              {fieldErrors.sizeMm && <p className="text-xs text-destructive mt-1">{fieldErrors.sizeMm}</p>}
            </div>

            <div>
              <Label htmlFor="scoring">Scoring <span className="text-red-500">*</span></Label>
              <Select value={formData.scoring} onValueChange={(value) => setFormData({ ...formData, scoring: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scoring" />
                </SelectTrigger>
                <SelectContent>
                  {SCORING_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              {fieldErrors.scoring && <p className="text-xs text-destructive mt-1">{fieldErrors.scoring}</p>}
            </div>

            <div>
              <Label htmlFor="commonUse">Common Use / Indication <span className="text-red-500">*</span></Label>
              <Input
                id="commonUse"
                value={formData.commonUse}
                onChange={(e) => setFormData({ ...formData, commonUse: e.target.value })}
                placeholder="e.g., Pain relief, Hypertension"
              />
              {fieldErrors.commonUse && <p className="text-xs text-destructive mt-1">{fieldErrors.commonUse}</p>}
            </div>

            <div>
              <Label htmlFor="market">Country / Market</Label>
              <Select value={formData.market} onValueChange={(value) => setFormData({ ...formData, market: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select market" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Singapore">Singapore</SelectItem>
                  <SelectItem value="USA">USA</SelectItem>
                  <SelectItem value="EU">EU</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="approvalStatus">Approval Status / Source</Label>
              <Select value={formData.approvalStatus} onValueChange={(value) => setFormData({ ...formData, approvalStatus: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Prescription-only">Prescription-only</SelectItem>
                  <SelectItem value="Over-the-counter">Over-the-counter</SelectItem>
                  <SelectItem value="FDA-approved">FDA-approved</SelectItem>
                  <SelectItem value="HSA-approved">HSA-approved</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes / Warnings <span className="text-xs text-muted-foreground ml-1">(Optional)</span></Label>
              <textarea
                id="notes"
                className="mt-1 w-full min-h-[90px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={formData.notes}
                placeholder="e.g., May cause drowsiness"
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Submitting..." : "Submit Contribution"}
          </Button>
          <WebcamCapture open={!!showWebcam} onClose={() => { setShowWebcam(null); setTimeout(()=> lastTriggerRef.current?.focus(), 50) }} onCapture={handleCapture} />
        </form>
      </CardContent>
    </Card>
  )
}
