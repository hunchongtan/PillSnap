"use client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Pill, Info, Shield, Zap, Database, Eye, Search, AlertTriangle } from "lucide-react"

export function Navigation() {
  return (
    <>
      <div className="bg-amber-50 border-b border-amber-200 py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 text-amber-800">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">
              For informational purposes only. Always consult healthcare professionals for medication identification.
            </span>
          </div>
        </div>
      </div>

      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold text-foreground">PillSnap</span>
                <div className="text-sm text-muted-foreground">Pill Identifier</div>
              </div>
              <Badge variant="secondary" className="ml-2 text-xs">
                AI-Powered
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <AboutDialog />
              <HowItWorksDialog />
            </div>
          </div>
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5" />
            About PillSnap
          </DialogTitle>
          <DialogDescription className="text-left space-y-4 pt-4">
            <p>
              PillSnap is an AI-powered pill identification tool that helps users identify medications through image
              analysis. Our system combines advanced computer vision and machine learning to analyze pill
              characteristics.
            </p>

            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Key Features:</h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-start gap-3">
                  <Eye className="w-4 h-4 text-secondary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">AI Vision Analysis</p>
                    <p className="text-sm text-muted-foreground">
                      Advanced image recognition to extract pill attributes
                    </p>
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

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-destructive mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Important Disclaimer</p>
                  <p className="text-sm text-muted-foreground">
                    This tool is for informational purposes only. Always consult healthcare professionals for medication
                    identification and safety.
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

function HowItWorksDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Zap className="w-4 h-4 mr-2" />
          How It Works
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
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
                  <h4 className="font-semibold text-foreground">Image Upload & Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload a clear photo of your pill. Our system processes the image and prepares it for analysis.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary-foreground text-sm font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">AI-Powered Detection</h4>
                  <p className="text-sm text-muted-foreground">
                    Roboflow AI detects and segments the pill boundaries, isolating the medication from the background.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary-foreground text-sm font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Attribute Extraction</h4>
                  <p className="text-sm text-muted-foreground">
                    OpenAI Vision analyzes the pill to extract key characteristics: shape, color, size, imprints, and
                    coating.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary-foreground text-sm font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Review & Refine</h4>
                  <p className="text-sm text-muted-foreground">
                    Review the extracted attributes and make corrections if needed using our intuitive editor interface.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary-foreground text-sm font-bold">5</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Database Search</h4>
                  <p className="text-sm text-muted-foreground">
                    Our system searches the comprehensive medication database using the refined attributes to find
                    matches.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary-foreground text-sm font-bold">6</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Results & Information</h4>
                  <p className="text-sm text-muted-foreground">
                    Get detailed information about potential matches, including medication names, manufacturers, and
                    confidence scores.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
              <h4 className="font-semibold text-foreground mb-2">Technology Stack</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Roboflow AI</Badge>
                <Badge variant="outline">OpenAI Vision</Badge>
                <Badge variant="outline">Supabase</Badge>
                <Badge variant="outline">Next.js</Badge>
                <Badge variant="outline">TypeScript</Badge>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
