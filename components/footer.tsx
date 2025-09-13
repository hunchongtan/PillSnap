import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PillContribute } from "./pill-contribute"
import { Plus } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 mt-24">
      <div className="container mx-auto px-4 py-8">
  <div className="text-center mb-8 pb-8">
          <h3 className="text-lg font-semibold mb-2">Help Improve Our Database</h3>
          <p className="text-muted-foreground mb-4 max-w-2xl mx-auto">
            Pharmaceutical companies can contribute high-quality pill images to help others identify medications safely.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Contribute pill images
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Contribute Pill Images</DialogTitle>
              </DialogHeader>
              <PillContribute />
            </DialogContent>
          </Dialog>
        </div>

  <div className="mt-8 pt-6 text-center">
          <p className="text-sm text-muted-foreground">© 2025 PillSnap. Undertaking of <a href="https://hackitrx.devpost.com/" className="text-blue-600 hover:underline">SGHackitRx 2025</a>.</p>
        </div>
      </div>
    </footer>
  )
}
