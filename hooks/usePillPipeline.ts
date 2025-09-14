import { useCallback, useEffect, useRef, useState } from 'react'

export type ExtraInfo = {
  patientHistory: string
  possibleName: string
  notes: string
}

export type Det = {
  id: string
  conf: number
  class?: string
  box: { x: number; y: number; width: number; height: number }
  previewUrl?: string
  cropped?: { base64: string; mimeType: string }
  attributes?: {
    shape: string
    color: string
    size_mm: number
    thickness_mm: number
    front_imprint: string
    back_imprint: string
    scoring: string
    notes: string
  }
  extra?: ExtraInfo
  loading: boolean
  error?: string
}

type SegmentPrediction = {
  x: number
  y: number
  width: number
  height: number
  confidence: number
  class?: string
  detection_id?: string
}
type SegmentResponse = {
  image: { width: number; height: number }
  predictions: SegmentPrediction[]
}

type CropResponse = {
  image: string
  mimeType: string
  width: number
  height: number
}

type AnalyzeAttributes = {
  shape?: string
  color?: string
  size_mm?: number
  thickness_mm?: number
  front_imprint?: string
  back_imprint?: string
  scoring?: string
  notes?: string
}

type AnalyzeResponse = { attributes: AnalyzeAttributes }

const STORAGE_KEY = 'pillPipeline:last'

export function usePillPipeline() {
  const [dets, setDets] = useState<Det[]>([])
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const originalBase64Ref = useRef<string>('')
  const mimeTypeRef = useRef<string>('')

  // Restore last state on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { dets: Det[] }
        if (Array.isArray(parsed.dets))
          setDets(
            parsed.dets.map((d) => ({
              ...d,
              loading: false,
              extra: d.extra || { patientHistory: '', possibleName: '', notes: '' },
            }))
          )
      } catch {}
    }
  }, [])

  // Persist on change
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ dets }))
  }, [dets])

  const run = useCallback(async (file: File) => {
    setProcessing(true)
    setError(undefined)
    setDets([])
    try {
      // Read base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve((r.result as string).split(',')[1])
        r.onerror = reject
        r.readAsDataURL(file)
      })
      originalBase64Ref.current = base64
      mimeTypeRef.current = file.type

      // Segment
      const fd = new FormData()
      fd.append('file', file)
      const segRes = await fetch('/api/segment', { method: 'POST', body: fd })
      if (!segRes.ok) throw new Error('Segmentation failed')
      const segJson = (await segRes.json()) as SegmentResponse
      const W = segJson.image?.width ?? 0
      const H = segJson.image?.height ?? 0

      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max))

      // Filter and map predictions
      const predictions = (segJson.predictions || []).filter((p) => (p.confidence ?? 0) >= 0.6)
      if (!predictions.length) throw new Error('No pills detected with confidence ≥ 0.6')

      const mapped: Det[] = predictions.map((p, i) => {
        const left = Math.round(p.x - p.width / 2)
        const top = Math.round(p.y - p.height / 2)
        const width = Math.round(p.width)
        const height = Math.round(p.height)
        const x = clamp(left, 0, Math.max(0, W - 1))
        const y = clamp(top, 0, Math.max(0, H - 1))
        const w = clamp(width, 1, Math.max(1, W - x))
        const h = clamp(height, 1, Math.max(1, H - y))
        return {
          id: p.detection_id || String(i + 1),
          conf: p.confidence ?? 0,
          class: p.class,
          box: { x, y, width: w, height: h },
          loading: true,
          extra: { patientHistory: '', possibleName: '', notes: '' },
        }
      })
      setDets(mapped)

      // Process each detection in parallel: crop -> analyze
      await Promise.allSettled(
        mapped.map(async (d) => {
          try {
            // crop
            const cropRes = await fetch('/api/crop', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image: originalBase64Ref.current,
                mimeType: mimeTypeRef.current,
                box: d.box,
                paddingPct: 0.06,
                isTopLeft: true,
              }),
            })
            if (!cropRes.ok) throw new Error('Crop failed')
            const cropJson = (await cropRes.json()) as CropResponse
            const previewUrl = `data:${cropJson.mimeType};base64,${cropJson.image}`

            setDets((prev) =>
              prev.map((x) =>
                x.id === d.id
                  ? {
                      ...x,
                      previewUrl,
                      cropped: {
                        base64: cropJson.image,
                        mimeType: cropJson.mimeType,
                      },
                    }
                  : x
              )
            )

            // analyze
            const anRes = await fetch('/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image: cropJson.image,
                mimeType: cropJson.mimeType,
              }),
            })
            if (!anRes.ok) throw new Error('Analyze failed')
            const anJson = (await anRes.json()) as AnalyzeResponse
            const a = anJson.attributes || {}

            const attributes = {
              shape: a.shape || '',
              color: a.color || '',
              size_mm: typeof a.size_mm === 'number' ? a.size_mm : 0,
              thickness_mm: typeof a.thickness_mm === 'number' ? a.thickness_mm : 0,
              front_imprint:
                a.front_imprint && a.front_imprint !== 'unclear' ? a.front_imprint : '',
              back_imprint: a.back_imprint && a.back_imprint !== 'unclear' ? a.back_imprint : '',
              scoring: a.scoring || '',
              notes: a.notes || '',
            }

            setDets((prev) =>
              prev.map((x) => (x.id === d.id ? { ...x, attributes, loading: false } : x))
            )
          } catch (e) {
            setDets((prev) =>
              prev.map((x) =>
                x.id === d.id
                  ? {
                      ...x,
                      loading: false,
                      error: e instanceof Error ? e.message : String(e),
                    }
                  : x
              )
            )
          }
        })
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Processing failed')
    } finally {
      setProcessing(false)
    }
  }, [])

  type DetPatch = Partial<Omit<Det, 'extra'>> & { extra?: Partial<ExtraInfo> }
  const updateDet = useCallback((id: string, patch: DetPatch) => {
    setDets((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              ...patch,
              extra: patch.extra
                ? {
                    ...(d.extra || { patientHistory: '', possibleName: '', notes: '' }),
                    ...patch.extra,
                  }
                : d.extra,
            }
          : d
      )
    )
  }, [])

  return { dets, processing, error, run, setDets, updateDet }
}
