import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const pillId = formData.get("pillId") as string

    if (!pillId) {
      return NextResponse.json({ error: "Pill ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    const { error } = await supabase.from("pills").update({ status: "published" }).eq("id", pillId)

    if (error) {
      console.error("Approval error:", error)
      return NextResponse.json({ error: "Failed to approve pill" }, { status: 500 })
    }

    return NextResponse.redirect(new URL("/admin", request.url))
  } catch (error) {
    console.error("Approval error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
