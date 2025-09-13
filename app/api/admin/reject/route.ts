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

    // Delete the pill record and associated images
    const { data: pill, error: fetchError } = await supabase
      .from("pills")
      .select("image_url, back_image_url")
      .eq("id", pillId)
      .single()

    if (fetchError) {
      console.error("Fetch error:", fetchError)
      return NextResponse.json({ error: "Failed to fetch pill data" }, { status: 500 })
    }

    // Delete images from storage if they exist
    if (pill.image_url) {
      const imagePath = pill.image_url.split("/").pop()
      if (imagePath) {
        await supabase.storage.from("pill-images").remove([`contributions/${imagePath}`])
      }
    }

    if (pill.back_image_url) {
      const backImagePath = pill.back_image_url.split("/").pop()
      if (backImagePath) {
        await supabase.storage.from("pill-images").remove([`contributions/${backImagePath}`])
      }
    }

    // Delete the pill record
    const { error } = await supabase.from("pills").delete().eq("id", pillId)

    if (error) {
      console.error("Deletion error:", error)
      return NextResponse.json({ error: "Failed to reject pill" }, { status: 500 })
    }

    return NextResponse.redirect(new URL("/admin", request.url))
  } catch (error) {
    console.error("Rejection error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
