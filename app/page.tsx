"use client"

import { useState } from "react"
import { PillWizard } from "@/components/pill-wizard"
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
          sessionId: `quick_${Date.now()}`,
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
      setShowWizard(false)
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

  if (showWizard && currentStep === "review") {
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
            <h1 className="text-4xl font-bold text-foreground mb-2">Review pill attributes</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Review and edit the detected pill attributes before searching.
            </p>
          </div>
          <PillWizard
            onComplete={(result) => {
              setSearchResults(result)
              setCurrentStep("results")
              setShowWizard(false)
            }}
          />
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="bg-amber-50 border-b border-amber-200 py-2">
        <div className="container mx-auto px-4">
          <p className="text-sm text-amber-800 text-center">
            <strong>Medical Disclaimer:</strong> This tool is for informational purposes only and should not replace
            professional medical advice. Always consult with a healthcare provider before taking any medication.
          </p>
        </div>
      </div>

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
                Search by imprint, shape, and color, or use our camera for AI-powered identification.
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

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-8 max-w-4xl mx-auto">
              <p className="text-sm text-amber-800 text-center">
                <strong>Medical Disclaimer:</strong> This tool is for informational purposes only and should not replace
                professional medical advice. Always consult with a healthcare provider before taking any medication.
              </p>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
