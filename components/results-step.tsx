"use client"

import React from "react"
import { Det } from "@/hooks/usePillPipeline"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PillResultsGrid } from "@/components/pill-results-grid"

export function ResultsStep({ pill, allPills, onBack, onSelectPill }: { pill: Det; allPills: Det[]; onBack: () => void; onSelectPill: (id: string) => void }) {
  const ids = allPills.map(p => p.id)
  const idx = Math.max(0, ids.indexOf(pill.id))
  const prevId = idx > 0 ? ids[idx-1] : null
  const nextId = idx < ids.length - 1 ? ids[idx+1] : null

  const imprint = pill.attributes?.imprint || ""
  const shape = pill.attributes?.shape || ""
  const color = pill.attributes?.color || ""
  const size_mm = pill.attributes?.size_mm || 0
  const scoring = pill.attributes?.scoring || "no score"
  const extra = pill.extra || { patientHistory: "", possibleName: "", notes: "" }
  const hasExtra = !!(extra.patientHistory || extra.possibleName || extra.notes)

  return (
    <div className="pt-4 md:pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          ← Back to Detected Pills
        </button>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={!prevId} onClick={() => prevId && onSelectPill(prevId)}>Previous Pill</Button>
          <Button variant="outline" disabled={!nextId} onClick={() => nextId && onSelectPill(nextId)}>Next Pill</Button>
        </div>
      </div>

      <Card className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-6">
          <div className="w-full sm:w-48 aspect-square bg-muted rounded-lg overflow-hidden">
            {pill.previewUrl ? <img src={pill.previewUrl} alt="Pill" className="w-full h-full object-contain"/> : <div className="w-full h-full"/>}
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Imprint</div>
            <div className="font-medium">{imprint}</div>
            <div className="text-muted-foreground">Shape</div>
            <div className="font-medium">{shape}</div>
            <div className="text-muted-foreground">Color</div>
            <div className="font-medium">{color}</div>
            <div className="text-muted-foreground">Size</div>
            <div className="font-medium">{size_mm ? `${size_mm.toFixed(1)} mm` : ""}</div>
            <div className="text-muted-foreground">Scoring</div>
            <div className="font-medium">{scoring || "no score"}</div>
          </div>
        </CardContent>
      </Card>

      {hasExtra && (
        <Card className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <CardContent className="p-4 space-y-2 text-sm">
            <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Additional Information</div>
            {extra.possibleName && (
              <div className="grid grid-cols-2 gap-2">
                <div className="text-muted-foreground">Possible Pill Name</div>
                <div className="font-medium">{extra.possibleName}</div>
              </div>
            )}
            {extra.patientHistory && (
              <div className="grid grid-cols-2 gap-2">
                <div className="text-muted-foreground">Patient History / Context</div>
                <div className="font-medium whitespace-pre-wrap">{extra.patientHistory}</div>
              </div>
            )}
            {extra.notes && (
              <div className="grid grid-cols-2 gap-2">
                <div className="text-muted-foreground">Notes</div>
                <div className="font-medium whitespace-pre-wrap">{extra.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search integration */}
  <ResultsSearch attributes={{ imprint, shape, color, size_mm, scoring }} />
    </div>
  )
}

function ResultsSearch({ attributes }: { attributes: { imprint: string; shape: string; color: string; size_mm: number; scoring: string } }) {
  const { imprint, shape, color, size_mm } = attributes
  const payload: any = {
    attributes: {
      imprint: imprint || undefined,
      shape: shape || undefined,
      color: color || undefined,
      size_mm: size_mm || undefined,
    },
    sessionId: `multi_${new Date().toISOString()}`,
  }

  const [isSearching, setIsSearching] = React.useState(false)
  const [results, setResults] = React.useState<any[] | null>(null)
  const [meta, setMeta] = React.useState<{ searchId?: string; confidence?: number; totalResults?: number }>({})

  React.useEffect(() => {
    let mounted = true
    const run = async () => {
      setIsSearching(true)
      try {
        const res = await fetch("/api/search/pills", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        if (res.ok) {
          const json = await res.json()
          if (!mounted) return
          setResults(json.results || [])
          setMeta({ searchId: json.searchId, confidence: json.confidence, totalResults: json.totalResults })
        } else {
          if (!mounted) return
          setResults([])
          setMeta({})
        }
      } catch {
        if (!mounted) return
        setResults([])
        setMeta({})
      } finally {
        if (!mounted) return
        setIsSearching(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [imprint, shape, color, size_mm])

  return (
    <div className="space-y-6">
      <PillResultsGrid results={results || []} isLoading={isSearching} />
    </div>
  )
}
