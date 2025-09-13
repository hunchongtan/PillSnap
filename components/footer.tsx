import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PillContribute } from "./pill-contribute"
import { Plus } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 mt-24">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8 pb-8 border-b border-border">
          <h3 className="text-lg font-semibold mb-2">Help Improve Our Database</h3>
          <p className="text-muted-foreground mb-4 max-w-2xl mx-auto">
            Pharmaceutical companies can contribute high-quality pill images to help others identify medications safely.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Contribute pill images (pharma)
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-foreground mb-3">PillSnap</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered pill identification for safer medication management. Built with advanced computer vision and
              machine learning.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-3">Safety</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Always verify with healthcare providers</li>
              <li>Do not rely solely on visual identification</li>
              <li>Consult pharmacists for medication questions</li>
              <li>Keep medications in original containers</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-3">Technology</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Roboflow AI for pill detection</li>
              <li>OpenAI Vision for attribute extraction</li>
              <li>Supabase for data management</li>
              <li>Next.js for web application</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 PillSnap. For informational purposes only. Not a substitute for professional medical advice.
          </p>
        </div>
      </div>
    </footer>
  )
}
