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

  const front = pill.attributes?.front_imprint || ""
  const back = pill.attributes?.back_imprint || ""
  const shape = pill.attributes?.shape || ""
  const color = pill.attributes?.color || ""
  const size_mm = pill.attributes?.size_mm || 0
  const scored = !!(pill.attributes?.scoring && !["none","unclear"].includes(pill.attributes.scoring.toLowerCase()))

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
            <div className="text-muted-foreground">Front Imprint</div>
            <div className="font-medium">{front}</div>
            <div className="text-muted-foreground">Back Imprint</div>
            <div className="font-medium">{back}</div>
            <div className="text-muted-foreground">Shape</div>
            <div className="font-medium">{shape}</div>
            <div className="text-muted-foreground">Color</div>
            <div className="font-medium">{color}</div>
            <div className="text-muted-foreground">Size</div>
            <div className="font-medium">{size_mm ? `${size_mm} mm` : ""}</div>
            <div className="text-muted-foreground">Scored</div>
            <div className="font-medium">{scored ? "Yes" : "No"}</div>
          </div>
        </CardContent>
      </Card>

      {/* Search integration */}
      <ResultsSearch attributes={{ front, back, shape, color, size_mm, scored }} />
    </div>
  )
}

function ResultsSearch({ attributes }: { attributes: { front: string; back: string; shape: string; color: string; size_mm: number; scored: boolean } }) {
  const { front, back, shape, color, size_mm, scored } = attributes
  const payload: any = {
    attributes: {
      imprint: [front, back].filter(Boolean).join(" ") || undefined,
      shape: shape || undefined,
      color: color || undefined,
      size_mm: size_mm || undefined,
      scored: scored || undefined,
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
  }, [front, back, shape, color, size_mm, scored])

  return (
    <div className="space-y-6">
      <PillResultsGrid results={results || []} isLoading={isSearching} />
    </div>
  )
}
