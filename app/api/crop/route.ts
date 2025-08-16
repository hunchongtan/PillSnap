// Type guard for error objects
function isErrorWithMessage(error: unknown): error is { message?: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}
import { type NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get("image") as File
    const boxJson = formData.get("box") as string

    if (!imageFile || !boxJson) {
      return NextResponse.json({ error: "Missing image or bounding box" }, { status: 400 })
    }

    const box = JSON.parse(boxJson)
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())

    const croppedImageBuffer = await sharp(imageBuffer)
      .extract({
        left: Math.round(box.x),
        top: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      })
      .toBuffer()

    const base64Image = croppedImageBuffer.toString("base64")
    const dataUrl = `data:image/jpeg;base64,${base64Image}`

    return NextResponse.json({ croppedImage: dataUrl })
  } catch (error: unknown) {
    console.error("Error cropping image:", error)
  return NextResponse.json({ error: `Failed to crop image: ${isErrorWithMessage(error) && typeof error.message === 'string' ? error.message : String(error)}` }, { status: 500 })
  }
}
