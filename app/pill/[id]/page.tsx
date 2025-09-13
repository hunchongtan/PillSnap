import { createServerClient } from "@/lib/server"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertTriangle, Info } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface PillDetailPageProps {
  params: { id: string }
}

export default async function PillDetailPage({ params }: PillDetailPageProps) {
  const supabase = createServerClient()

  const { data: pill, error } = await supabase
    .from("pills")
    .select("*")
    .eq("id", params.id)
    .eq("status", "published")
    .single()

  if (error || !pill) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto text-center">
            <CardContent className="p-8">
              <h1 className="text-2xl font-semibold mb-4">Pill Not Found</h1>
              <p className="text-muted-foreground mb-4">
                The pill you're looking for doesn't exist or is no longer available.
              </p>
              <Link href="/">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Search
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link href="/">
            <Button variant="outline" className="mb-6 bg-transparent">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Button>
          </Link>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Images */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pill Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pill.image_url && (
                      <div>
                        <h4 className="font-medium mb-2">Front</h4>
                        <img
                          src={pill.image_url || "/placeholder.svg"}
                          alt={`${pill.brand_name || pill.generic_name} front`}
                          className="w-full max-w-sm rounded-lg border"
                        />
                      </div>
                    )}
                    {pill.back_image_url && (
                      <div>
                        <h4 className="font-medium mb-2">Back</h4>
                        <img
                          src={pill.back_image_url || "/placeholder.svg"}
                          alt={`${pill.brand_name || pill.generic_name} back`}
                          className="w-full max-w-sm rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {pill.brand_name || pill.generic_name || "Unknown Medication"}
                  </CardTitle>
                  {pill.strength && <p className="text-lg text-muted-foreground">{pill.strength}</p>}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">Manufacturer</h4>
                      <p>{pill.manufacturer || "Not specified"}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">Dosage Form</h4>
                      <p className="capitalize">{pill.dosage_form || "Not specified"}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Physical Characteristics</h4>
                    <div className="flex flex-wrap gap-2">
                      {pill.shape && <Badge variant="outline">{pill.shape}</Badge>}
                      {pill.color && <Badge variant="outline">{pill.color}</Badge>}
                      {pill.scored !== null && <Badge variant="outline">{pill.scored ? "Scored" : "Not scored"}</Badge>}
                    </div>
                  </div>

                  {pill.imprint && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">Imprint</h4>
                      <p className="font-mono text-lg">{pill.imprint}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Safety Information */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important Safety Information:</strong> This information is for identification purposes only.
                  Always consult with a healthcare professional before taking any medication. Do not rely solely on
                  visual identification for medication safety.
                </AlertDescription>
              </Alert>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  If you believe this information is incorrect or if you have concerns about a medication, please
                  contact your pharmacist or healthcare provider immediately.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
