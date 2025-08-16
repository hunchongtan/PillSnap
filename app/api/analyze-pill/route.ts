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
              text: `You are a pharmaceutical image analysis expert working on a controlled identification system. Your role is to analyze the following pill image with strict attention to factual accuracy. You must avoid speculation or inference beyond what is visibly present in the image.

              🔎 STEP 1: VISUAL EXTRACTION (Do not infer or guess)
              - Extract only what is visually and clearly present. If any visual feature is obscured, damaged, or unclear, explicitly say: "Not clearly visible."
              - Characteristics to extract (in this order):
                - **Shape**: Choose from standard forms (e.g., round, oval, capsule, oblong, square, triangular, etc.)
                - **Color**: Use highly specific descriptors (e.g., "light yellow", "white with blue speckles")
                - **Size**: Estimate in millimeters only if a reference is available — otherwise state: "Size not reliably estimable"
                - **Imprint/Markings**: Extract all visible text, numbers, logos, or symbols. If any are missing or unclear, report exactly that.
                - **Scoring**: Note any division or break lines (e.g., single score, cross-score, none)
                - **Surface**: Describe texture (e.g., smooth, glossy, matte)
                - **Special Features**: Note coatings or design features **only if clearly visible**

              🧬 STEP 2: DATABASE MATCHING (Grounded identification only)
              Use the extracted data to search structured, reliable sources:
              - FDA Orange Book
              - NDC database
              - Drugs.com imprint index
              - RxList database

              You must:
              - Prioritize **exact imprint matches**
              - Never infer missing imprint content
              - Only include matches if all key visual characteristics align

              📉 STEP 3: CONFIDENCE SCORING (Use conservative judgment)
              Score each match (0–100%) using this strict rubric:
              - **90–100%**: Exact imprint + color + shape match
              - **80–89%**: Strong imprint + minor deviation in non-critical features
              - **70–79%**: Partial imprint + high visual similarity
              - **60–69%**: No imprint, but features match common pills
              - **Below 60%**: Identification uncertain or unreliable

              🛑 STEP 4: UNCERTAINTY & SAFETY RULES (Avoid hallucination)
              - If imprint is unclear, say so. Do not fill in or assume missing text.
              - Do not speculate about drug name, class, or use without a confident database match.
              - Never "invent" imprint codes, brands, or descriptions.
              - If visual data is insufficient, mark the result as low-confidence (e.g., 0–1%) and clearly say: "No reliable match found."
              - For low-confidence results, include reasoning and recommend human/pharmacist review.

              📦 STEP 5: OUTPUT FORMAT
              Return exactly 3 results, ranked by confidence.
              - If fewer than 3 valid matches are found, return placeholder entries with:
                - name: "Unknown"
                - confidence: 0 or 1
                - description: "No confident match found. Visual data insufficient."
                - Explain what features were missing or unclear.
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
