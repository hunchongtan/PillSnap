"use client"

import { useState } from "react"
import { PillMultiReview } from "@/components/pill-multi-review"
import { PillSearchBar } from "@/components/pill-search-bar"
import { PillResultsGrid } from "@/components/pill-results-grid"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { BreadcrumbNavigation, type BreadcrumbStep, type FlowType } from "@/components/breadcrumb-navigation"

interface SearchFilters {
  imprint?: string
  shape?: string
  color?: string
}

interface SearchResult {
  results: any[]
  confidence: number
  searchId: string
  totalResults: number
}

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<BreadcrumbStep>("search")
  const [flowType, setFlowType] = useState<FlowType>("manual")
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null) // Updated type
  const [isSearching, setIsSearching] = useState(false)
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({})
  const [showWizard, setShowWizard] = useState(false)

  const handleQuickSearch = async (query: SearchFilters) => {
    setSearchFilters(query)
    setIsSearching(true)
    setFlowType("manual")

    try {
      const response = await fetch("/api/search/pills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attributes: query,
          sessionId: `quick_${new Date().toISOString()}`,
        }),
      })

      if (response.ok) {
        const result: SearchResult = await response.json() // Fixed type
        setSearchResults(result)
        setCurrentStep("results")
      }
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleCameraClick = () => {
    setFlowType("camera")
    setShowWizard(true)
    setCurrentStep("review")
  }

  const handleStepClick = (step: BreadcrumbStep) => {
    console.log("[handleStepClick] Step clicked:", step)
    if (step === "search") {
      setCurrentStep("search")
      console.log("[handleStepClick] Current step set to 'search'")
      setShowWizard(false)
      setSearchResults(null)
    } else if (step === "review" && flowType === "camera") {
      setCurrentStep("review")
      console.log("[handleStepClick] Current step set to 'review'")
      setShowWizard(true)
    } else if (step === "results") {
      setCurrentStep("results")
      console.log("[handleStepClick] Current step set to 'results'")
      // Keep wizard visible for camera flow results
      setShowWizard(flowType === "camera")
    }
  }

  const handleBack = () => {
    console.log("[handleBack] Current step before back:", currentStep)
    if (currentStep === "results") {
      if (flowType === "camera") {
        setCurrentStep("review")
        console.log("[handleBack] Current step set to 'review'")
        setShowWizard(true)
      } else {
        setCurrentStep("search")
        console.log("[handleBack] Current step set to 'search'")
        setSearchResults(null)
      }
    } else if (currentStep === "review") {
      setCurrentStep("search")
      console.log("[handleBack] Current step set to 'search'")
      setShowWizard(false)
    }
  }

  const handleEditFilters = () => {
    setCurrentStep("search")
    setShowWizard(false)
  }

  if (showWizard && (currentStep === "review" || currentStep === "results")) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <BreadcrumbNavigation
            currentStep={currentStep}
            flowType={flowType}
            onStepClick={handleStepClick}
            onBack={handleBack}
          />
          <div className="text-center mb-8">
            {currentStep === "review" ? (
              <>
                <h1 className="text-4xl font-bold text-foreground mb-2">Review pill attributes</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Review and edit the detected pill attributes before searching.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-4xl font-bold text-foreground mb-2">Results</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Browse matches based on the selected pill's attributes.
                </p>
              </>
            )}
          </div>
          <div className="max-w-6xl mx-auto">
            <PillMultiReview
              onFlowStepChange={(s) => {
                if (s === 3) {
                  setCurrentStep("results")
                  setShowWizard(true)
                } else if (s === 2) {
                  setCurrentStep("review")
                  setShowWizard(true)
                }
              }}
            />
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Disclaimer banner removed in favor of single global tooltip in Navigation */}

      <div className="container mx-auto px-4 py-8">
        {currentStep !== "search" && (
          <BreadcrumbNavigation
            currentStep={currentStep}
            flowType={flowType}
            onStepClick={handleStepClick}
            onBack={handleBack}
          />
        )}

        {/* Search Step */}
        {currentStep === "search" && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">Search for your pill</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Search by imprint, shape, and color, or use the camera to extract attributes from a photo.
              </p>
            </div>

            <div className="max-w-4xl mx-auto mb-12">
              <PillSearchBar
                onSearch={handleQuickSearch}
                onCameraClick={handleCameraClick}
                initialValues={searchFilters}
              />
            </div>
          </>
        )}

        {/* Results Step */}
        {currentStep === "results" && searchResults && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">Results</h1>

              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {searchFilters.imprint && (
                    <span className="bg-muted px-2 py-1 rounded">Imprint: {searchFilters.imprint}</span>
                  )}
                  {searchFilters.shape && (
                    <span className="bg-muted px-2 py-1 rounded">Shape: {searchFilters.shape}</span>
                  )}
                  {searchFilters.color && (
                    <span className="bg-muted px-2 py-1 rounded">Color: {searchFilters.color}</span>
                  )}
                </div>
                <button onClick={handleEditFilters} className="text-sm text-primary hover:underline">
                  Edit Filters
                </button>
              </div>
            </div>

            <div className="max-w-6xl mx-auto">
              <PillResultsGrid results={searchResults.results} isLoading={isSearching} />
            </div>

            {/* Inline disclaimer removed to avoid duplication; Navigation tooltip covers this */}
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
