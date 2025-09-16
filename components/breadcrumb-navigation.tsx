"use client"

import { ChevronRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export type BreadcrumbStep = "search" | "review" | "results"
export type FlowType = "manual" | "camera"

interface BreadcrumbNavigationProps {
  currentStep: BreadcrumbStep
  flowType: FlowType
  onStepClick: (step: BreadcrumbStep) => void
  onBack: () => void
}

export function BreadcrumbNavigation({ currentStep, flowType, onStepClick, onBack }: BreadcrumbNavigationProps) {
  const steps = [
    { key: "search" as const, label: "Search" },
    { key: "review" as const, label: "Review" },
    { key: "results" as const, label: "Results" },
  ]

  const getStepStatus = (stepKey: BreadcrumbStep) => {
    const stepIndex = steps.findIndex((s) => s.key === stepKey)
    const currentIndex = steps.findIndex((s) => s.key === currentStep)

    if (stepKey === "review" && flowType === "manual") {
      return "skipped"
    }

    if (stepIndex < currentIndex) return "completed"
    if (stepIndex === currentIndex) return "current"
    return "upcoming"
  }

  const isClickable = (stepKey: BreadcrumbStep) => {
    if (stepKey === "review" && flowType === "manual") return false
    const stepIndex = steps.findIndex((s) => s.key === stepKey)
    const currentIndex = steps.findIndex((s) => s.key === currentStep)
    return stepIndex <= currentIndex
  }

  const compactLabel = (label: string) => label
  const isTiny = typeof window !== "undefined" && window.innerWidth < 380

  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex items-center justify-between sm:mb-2">
        {/* Back Button */}
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2 bg-transparent">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center space-x-1">
          {steps.map((step, index) => {
            const status = getStepStatus(step.key)
            const clickable = isClickable(step.key)

            return (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => clickable && onStepClick(step.key)}
                  disabled={!clickable}
                  className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    status === "current"
                      ? "bg-primary text-primary-foreground"
                      : status === "completed"
                        ? "text-primary hover:bg-primary/10"
                        : status === "skipped"
                          ? "text-muted-foreground/50 cursor-not-allowed"
                          : "text-muted-foreground cursor-not-allowed"
                  } ${clickable && status !== "current" ? "hover:bg-muted" : ""}`}
                >
                  {compactLabel(step.label)}
                </button>
                {index < steps.length - 1 && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mx-1" />}
              </div>
            )
          })}
        </nav>

        {/* Spacer for alignment on desktop */}
        <div className="hidden sm:block w-20" />
      </div>

      {/* Breadcrumbs below on small screens */}
      <nav className="sm:hidden flex items-center justify-center space-x-1 mt-2 w-full">
        {isTiny ? (
          <span className="text-xs font-medium text-muted-foreground">
            {steps.find(s => s.key === currentStep)?.label}
          </span>
        ) : (
          steps.map((step, index) => {
            const status = getStepStatus(step.key)
            const clickable = isClickable(step.key)
            return (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => clickable && onStepClick(step.key)}
                  disabled={!clickable}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    status === "current"
                      ? "bg-primary text-primary-foreground"
                      : status === "completed"
                        ? "text-primary hover:bg-primary/10"
                        : status === "skipped"
                          ? "text-muted-foreground/50 cursor-not-allowed"
                          : "text-muted-foreground cursor-not-allowed"
                  } ${clickable && status !== "current" ? "hover:bg-muted" : ""}`}
                >
                  {compactLabel(step.label)}
                </button>
                {index < steps.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground mx-1" />}
              </div>
            )
          })
        )}
      </nav>
    </div>
  )
}
