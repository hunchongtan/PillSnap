import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const UploadSchema = z.object({
  file: z.instanceof(File),
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 10MB." }, { status: 400 });
    }

    return NextResponse.json({ message: "File is valid." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process upload." }, { status: 500 });
  }
}
