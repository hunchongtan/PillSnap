import axios from "axios";
import { type NextRequest, NextResponse } from "next/server";

// Roboflow API configuration
const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;
const ROBOFLOW_MODEL_URL = process.env.ROBOFLOW_MODEL_URL;

function isErrorWithMessage(e: unknown): e is { message?: string } {
  return typeof e === "object" && e !== null && "message" in e;
}

export async function POST(request: NextRequest) {
  try {
    console.log("[POST] Received request to Roboflow API");
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const imageUrl = formData.get("imageUrl") as string | null;

    console.log("[POST] Form data extracted", { file, imageUrl });

    if (!file && !imageUrl) {
      console.error("[POST] Validation error: Provide file or imageUrl");
      return NextResponse.json(
        { error: "Provide file or imageUrl" },
        { status: 400 }
      );
    }

    let payload: string | undefined;
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      payload = `data:${file.type};base64,${base64}`;
      console.log("[POST] File converted to base64 payload");
    }

    console.log("[POST] Sending request to Roboflow API", {
      url: `${ROBOFLOW_MODEL_URL}?api_key=${ROBOFLOW_API_KEY}`,
      params: imageUrl ? { image: imageUrl } : {},
      payload,
    });

    const response = await axios({
      method: "POST",
      url: `${ROBOFLOW_MODEL_URL}?api_key=${ROBOFLOW_API_KEY}`,
      params: imageUrl ? { image: imageUrl } : {},
      data: payload,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log("[POST] Roboflow API response", response.data);
    return NextResponse.json(response.data, { status: 200 });
  } catch (e: unknown) {
    console.error("[POST] Error occurred while processing request", e);
    return NextResponse.json(
      {
        error:
          isErrorWithMessage(e) && typeof e.message === "string"
            ? e.message
            : String(e),
      },
      { status: 500 }
    );
  }
}
