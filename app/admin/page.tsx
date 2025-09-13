import { createServerClient } from "@/lib/server"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, X } from "lucide-react"

export default async function AdminPage() {
  const supabase = createServerClient()

  const { data: pendingPills, error } = await supabase
    .from("pills")
    .select("*")
    .eq("status", "pending_review")
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
              {!pendingPills || pendingPills.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending contributions to review.</p>
              ) : (
                <div className="space-y-4">
                  {pendingPills.map((pill) => (
                    <div key={pill.id} className="border rounded-lg p-4">
                      <div className="grid md:grid-cols-4 gap-4 items-start">
                        <div>
                          {pill.image_url && (
                            <img
                              src={pill.image_url || "/placeholder.svg"}
                              alt="Pill front"
                              className="w-24 h-24 object-cover rounded border"
                            />
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <h3 className="font-semibold">{pill.brand_name || pill.generic_name || "Unnamed"}</h3>
                          <p className="text-sm text-muted-foreground">{pill.manufacturer}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {pill.imprint && <Badge variant="outline">{pill.imprint}</Badge>}
                            {pill.shape && <Badge variant="outline">{pill.shape}</Badge>}
                            {pill.color && <Badge variant="outline">{pill.color}</Badge>}
                            {pill.strength && <Badge variant="outline">{pill.strength}</Badge>}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <form action="/api/admin/approve" method="POST">
                            <input type="hidden" name="pillId" value={pill.id} />
                            <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          </form>
                          <form action="/api/admin/reject" method="POST">
                            <input type="hidden" name="pillId" value={pill.id} />
                            <Button type="submit" variant="destructive" size="sm">
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </form>
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
