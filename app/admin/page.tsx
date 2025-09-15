import { createServerClient } from "@/lib/server"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, X } from "lucide-react"
import Link from "next/link"

export default async function AdminPage() {
  const supabase = await createServerClient()

  const { data: pills, error } = await supabase
    .from("pills")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

          <Card>
            <CardHeader>
              <CardTitle>Pending Pill Contributions</CardTitle>
              <p className="text-muted-foreground">
                Review and approve pill contributions from pharmaceutical companies.
              </p>
            </CardHeader>
            <CardContent>
              {!pills || pills.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending contributions to review.</p>
              ) : (
                <div className="space-y-4">
                  {pills.map((pill) => (
                    <div key={pill.id} className="border rounded-lg p-4">
                      <div className="grid md:grid-cols-4 gap-4 items-start">
                        <div className="flex gap-2">
                          <div>
                            {pill.image_url && (
                              <img
                                src={pill.image_url || "/placeholder.svg"}
                                alt="Pill front"
                                className="w-24 h-24 object-cover rounded border"
                              />
                            )}
                          </div>
                          <div>
                            {pill.back_image_url && (
                              <img
                                src={pill.back_image_url || "/placeholder.svg"}
                                alt="Pill back"
                                className="w-24 h-24 object-cover rounded border"
                              />
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <h3 className="font-semibold">{pill.name || pill.brand_name || "Unnamed"}</h3>
                          <p className="text-sm text-muted-foreground">{pill.manufacturer}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {pill.imprint && <Badge variant="outline">{pill.imprint}</Badge>}
                            {pill.shape && <Badge variant="outline">{pill.shape}</Badge>}
                            {pill.color && <Badge variant="outline">{pill.color}</Badge>}
                            {typeof pill.size_mm === 'number' && <Badge variant="outline">{pill.size_mm} mm</Badge>}
                            {pill.scoring && <Badge variant="outline">{pill.scoring}</Badge>}
                          </div>
                        </div>

                        <div className="flex gap-2 items-center justify-end">
                          <Link href={`/pill/${pill.id}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  )
}
