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
      model: openai("gpt-4.1-mini"),
      schema: PillIdentificationSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
              `You are a pharmaceutical image analysis expert assisting in a computer vision task. Your job is to analyze the provided image of a pill with the highest possible precision. Follow this exact protocol:

              --- 
              🔍 VISUAL CHARACTERISTICS (in order of priority):
              - **Shape**: Identify using standard categories (round, oval, oblong, capsule, square, triangular, etc.)
              - **Color**: Describe with specificity (e.g., "light blue", "white with red speckles", etc.)
              - **Size**: Estimate size in millimeters if possible
              - **Imprint**: Extract all visible text, numbers, symbols, or logos (even partial or unclear ones)
              - **Scoring**: Note any scoring lines (single, double, cross-score)
              - **Surface**: Describe texture (smooth, coated, glossy, matte, etc.)
              - **Special Features**: Note enteric coating, extended-release indicators, unusual markings, etc.

              ---
              🧬 DATABASE MATCHING:
              Use all visual characteristics to find matches in authoritative pharmaceutical databases:
              - FDA Orange Book
              - NDC Code Database
              - Imprint databases (Drugs.com, RxList)

              Emphasize **exact imprint matches**. If imprint is partial or unclear, still return best-effort match.

              ---
              📊 CONFIDENCE SCORING (0–100%):
              Use this guide:
              - 90–100%: Full imprint + shape + color match
              - 80–89%: Strong imprint + minor feature mismatch
              - 70–79%: Partial imprint + strong visual match
              - 60–69%: No imprint, but strong visual resemblance
              - Below 60%: Very low confidence or unknown pill

              ---
              ⚠️ SAFETY & LIMITATIONS:
              - Never assume imprint content—only report what's clearly visible.
              - If imprint is unclear, explicitly mention that.
              - If the image contains multiple pills, focus on the **most prominent** one.
              - Explain your rationale for each identification.
              - Warn if the pill resembles a controlled substance or has look-alikes.
              - Recommend verification for low-confidence results.

              ---
              🎯 OUTPUT FORMAT:
              Return **exactly 3 results** ranked by confidence:
              - Always return 3 entries, even if confidence is very low.
              - For uncertain identifications, include placeholders with minimal confidence and explain the ambiguity in the description.
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
