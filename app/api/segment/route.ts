import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";

const ROBOFLOW_API_URL = "https://api.roboflow.com/your-project-name/segment";
const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const response = await fetch(`${ROBOFLOW_API_URL}?api_key=${ROBOFLOW_API_KEY}`, {
      method: "POST",
      body: file,
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Roboflow API error." }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to process segmentation." }, { status: 500 });
  }
}
