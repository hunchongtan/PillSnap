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

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Back Button */}
      <Button variant="outline" onClick={onBack} className="flex items-center gap-2 bg-transparent">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-1">
        {steps.map((step, index) => {
          const status = getStepStatus(step.key)
          const clickable = isClickable(step.key)

          return (
            <div key={step.key} className="flex items-center">
              <button
                onClick={() => clickable && onStepClick(step.key)}
                disabled={!clickable}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  status === "current"
                    ? "bg-primary text-primary-foreground"
                    : status === "completed"
                      ? "text-primary hover:bg-primary/10"
                      : status === "skipped"
                        ? "text-muted-foreground/50 cursor-not-allowed"
                        : "text-muted-foreground cursor-not-allowed"
                } ${clickable && status !== "current" ? "hover:bg-muted" : ""}`}
              >
                {step.label}
              </button>
              {index < steps.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />}
            </div>
          )
        })}
      </nav>

      {/* Spacer for alignment */}
      <div className="w-20" />
    </div>
  )
}
