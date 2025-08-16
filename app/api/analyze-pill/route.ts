// Type guard for error objects
function isErrorWithProps(error: unknown): error is { message?: string; code?: string; type?: string; status?: number } {
  return typeof error === 'object' && error !== null;
}
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

// Define the schema for pill identification results
const PillIdentificationSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        genericName: z.string(),
        brandName: z.string(),
        confidence: z.number().min(0).max(100),
        imprint: z.string(),
        shape: z.string(),
        color: z.string(),
        size: z.string(),
        scoring: z.string(),
        description: z.string(),
      })
    )
    .default([]),
});

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured");
      return NextResponse.json(
        {
          error:
            "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image." },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Please upload an image under 10MB." },
        { status: 400 }
      );
    }

    console.log(
      `Processing image: ${file.name}, size: ${file.size} bytes, type: ${file.type}`
    );

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    console.log("Sending request to OpenAI via AI SDK...");

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: PillIdentificationSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a pharmaceutical image analysis assistant. Your task is to extract clear visual features from the image of a pill and provide the 3 most likely identifications, using structured data and reasonable medical judgment.

              🧪 VISUAL ANALYSIS:
              Extract only what you can see — do not invent features. If something is unclear, say so, but still try to identify the pill using any partial data available.

              Analyze in this order:
              - **Shape** (e.g., round, capsule, oblong)
              - **Color** (be specific — e.g., "light blue", "white with red speckles")
              - **Size** (estimate in mm, or state "not clear")
              - **Imprint** (text, numbers, logos — extract all visible; if partial, report what is legible)
              - **Scoring** (any lines or break marks)
              - **Surface** (smooth, coated, matte, glossy)
              - **Special Features** (coating, time-release, etc.)

              📚 DATABASE MATCHING:
              Use the extracted features to search FDA/NDC/imprint databases (Drugs.com, RxList).
              - Try to find the **best match**, even if some features are missing.
              - Prioritize **exact imprint** matches, but allow partial imprint + strong visual similarity.

              📉 CONFIDENCE SCORING:
              Assign confidence from 0–100% based on:
              - Visual similarity
              - Imprint match quality
              - Feature completeness

              Use approximate ranges:
              - 90–100%: Clear, exact match
              - 70–89%: Good match with minor uncertainty
              - 50–69%: Reasonable guess based on partial info
              - Below 50%: Low-confidence fallback

              ⚠️ UNCERTAINTY HANDLING:
              - Do not hallucinate imprints or drug names.
              - If multiple pills are in the image, analyze the most clear one.
              - If imprint is unreadable, still return best-effort matches with explanation.
              - If confident matches are not possible, include "Unknown" entries with confidence 0–10% and explain why.

              🎯 OUTPUT:
              Return **exactly 3 results**, ordered by confidence.
              Each result must include:
              - name
              - genericName
              - brandName
              - confidence (0–100)
              - imprint
              - shape
              - color
              - size
              - scoring
              - description

              Be helpful and complete. Even partial matches are useful.
              `,
            },
            {
              type: "image",
              image: dataUrl,
            },
          ],
        },
      ],
      temperature: 0.2, // Lowered temperature for more consistent medical identification
    });

    console.log("Received response from OpenAI");
    console.log(
      `Successfully identified ${result.object.results.length} potential matches`
    );

    return NextResponse.json(result.object);
  } catch (error: unknown) {
    console.error("Error analyzing pill:", error);
    console.error("Error details:", {
      message: isErrorWithProps(error) && typeof error.message === 'string' ? error.message : String(error),
      code: isErrorWithProps(error) && typeof error.code === 'string' ? error.code : undefined,
      type: isErrorWithProps(error) && typeof error.type === 'string' ? error.type : undefined,
      status: isErrorWithProps(error) && typeof error.status === 'number' ? error.status : undefined,
    });

    if (
      isErrorWithProps(error) && typeof error.message === 'string' && error.message.includes("timeout") ||
      (isErrorWithProps(error) && error.code === "TIMEOUT")
    ) {
      return NextResponse.json(
        {
          error:
            "Request timed out. Please try again with a smaller image or check your connection.",
        },
        { status: 408 }
      );
    } else if (
      isErrorWithProps(error) && error.code === "insufficient_quota" ||
      (isErrorWithProps(error) && error.status === 429)
    ) {
      return NextResponse.json(
        {
          error:
            "OpenAI API quota exceeded. Please check your API usage and billing.",
        },
        { status: 429 }
      );
    } else if (
      isErrorWithProps(error) && error.code === "invalid_api_key" ||
      (isErrorWithProps(error) && error.status === 401)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.",
        },
        { status: 401 }
      );
    } else if (
      isErrorWithProps(error) && error.code === "model_not_found" ||
      (isErrorWithProps(error) && error.status === 404)
    ) {
      return NextResponse.json(
        {
          error:
            "OpenAI model not found. Please check if you have access to GPT-4 with vision.",
        },
        { status: 404 }
      );
    } else if (
      (isErrorWithProps(error) && typeof error.message === 'string' && error.message.includes("network")) ||
      (isErrorWithProps(error) && error.code === "ENOTFOUND")
    ) {
      return NextResponse.json(
        {
          error:
            "Network error. Please check your internet connection and try again.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: `Failed to analyze pill image: ${isErrorWithProps(error) && typeof error.message === 'string' ? error.message : "Unknown error"}`,
        details: (isErrorWithProps(error) && error.code) || (isErrorWithProps(error) && error.type) || "No additional details",
      },
      { status: 500 }
    );
  }
}
