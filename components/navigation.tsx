"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Info, Shield, Zap, Database, Eye, Search, AlertTriangle, Edit3, Menu, X } from "lucide-react"

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <>
      <div className="bg-amber-50 border-b border-amber-200 py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 text-amber-800">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium text-center">
              For informational purposes only. Always consult healthcare professionals for medication identification.
            </span>
          </div>
        </div>
      </div>

      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/icon.svg" alt="PillSnap" className="h-10 w-10 sm:h-16 sm:w-16" />
              <div>
                <span className="text-xl sm:text-2xl font-bold text-foreground">PillSnap</span>
                <div className="text-xs sm:text-sm text-muted-foreground">Pill Identification in a Snap</div>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <AboutDialog />
              <HowItWorksDialog />
            </div>

            <div className="sm:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setMobileOpen(v => !v)}>
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
          {mobileOpen && (
            <div className="sm:hidden mt-2 border-t border-border pt-2">
              <div className="flex flex-col gap-1">
                <AboutDialog />
                <HowItWorksDialog />
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}

function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Info className="w-4 h-4 mr-2" />
          About
        </Button>
      </DialogTrigger>
  <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            About PillSnap
          </DialogTitle>
          <DialogDescription className="text-left space-y-4 pt-4">
            <p>
              PillSnap helps you identify medications by either searching by a pill imprint, shape and color, or by
              uploading/taking a photo. The app extracts key features and searches your pill image library for likely matches.
            </p>

            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Key Features:</h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-start gap-3">
                  <Edit3 className="w-4 h-4 text-secondary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Manual Input</p>
                    <p className="text-sm text-muted-foreground">Type a pill name or imprint to search directly</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Eye className="w-4 h-4 text-secondary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Automatic Photo Analysis</p>
                    <p className="text-sm text-muted-foreground">Extracts visible attributes like shape, color, imprints, and scoring</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Database className="w-4 h-4 text-secondary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Comprehensive Database</p>
                    <p className="text-sm text-muted-foreground">
                      Extensive medication database with detailed information
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Search className="w-4 h-4 text-secondary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Smart Matching</p>
                    <p className="text-sm text-muted-foreground">Intelligent search algorithms for accurate results</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer block removed to avoid duplication; global tooltip remains */}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

function HowItWorksDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Zap className="w-4 h-4 mr-2" />
          How It Works
        </Button>
      </DialogTrigger>
  <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            How PillSnap Works
          </DialogTitle>
          <DialogDescription className="text-left space-y-6 pt-4">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary-foreground text-sm font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Start Your Search</h4>
                  <p className="text-sm text-muted-foreground">
                    Search for a pill by imprint, shape and color, or click the camera button to upload/take a photo.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary-foreground text-sm font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Segment Pills</h4>
                  <p className="text-sm text-muted-foreground">
                    If your photo contains multiple pills, the app automatically separates them so you can review each one.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary-foreground text-sm font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Automatic Description</h4>
                  <p className="text-sm text-muted-foreground">
                    For each pill, the system produces a short description of visible features (e.g., “white, round, scored line, imprint B10”).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary-foreground text-sm font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Review and Improve</h4>
                  <p className="text-sm text-muted-foreground">
                    Check these details and make edits if needed (for example, if an imprint was misread). You can also add optional context like patient history or a possible pill name.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary-foreground text-sm font-bold">5</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Search Your Library</h4>
                  <p className="text-sm text-muted-foreground">
                    The app uses the confirmed features to search your own pill image library and find likely matches.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary-foreground text-sm font-bold">6</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">View Results</h4>
                  <p className="text-sm text-muted-foreground">
                    See top matches ranked by how closely they match the attributes you provided.
                  </p>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
