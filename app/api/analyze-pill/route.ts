// /app/api/pill/route.ts

// 1) Safer error guard
function isErrorWithProps(
  error: unknown
): error is {
  message?: string;
  code?: string;
  type?: string;
  status?: number;
} {
  return typeof error === "object" && error !== null;
}

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

// 2) Output schema — EXACTLY 3 results, no extra keys
const PillResultSchema = z
  .object({
    name: z.string().min(1),
    genericName: z.string().min(1),
    brandName: z.string().min(1),
    confidence: z.number().min(0).max(100),
    imprint: z.string().default("unclear"),
    shape: z.string().default("unclear"),
    color: z.string().default("unclear"),
    size: z.string().default("unclear"),
    scoring: z.string().default("unclear"),
    // Keep the same field name for compatibility, but we’ll ask the model
    // to use this as “reasoning for match” rather than a marketing blurb.
    description: z.string().min(1),
  })
  .strict();

const PillIdentificationSchema = z
  .object({
    results: z.array(PillResultSchema).length(3),
  })
  .strict();

// 3) Helper prompt builder
function buildPrompt(medicalInfo?: string | null) {
  const context =
    medicalInfo && medicalInfo.trim() !== ""
      ? `\n\nMEDICAL CONTEXT (use only as a secondary filter; never override visible features):\n${medicalInfo.trim()}\n`
      : "";

  return `
  You are a pharmaceutical image analysis assistant.

  Your job:
  1) Extract visible features of the clearest pill in the image (perception only; no invention).
  2) Propose the 3 most likely identifications using your internal medical knowledge base (no live browsing).

  GUARDRAILS:
  - Do NOT claim to "look up" or "query" external databases (FDA/NDC/Drugs.com/RxList). You have no live access.
  - Do NOT invent imprints, colors, or features not clearly visible.
  - If anything is unclear, say "unclear" in the corresponding field, but still attempt best-effort identification.
  - Use medical context only to break ties among visually similar candidates.
  - Confidence is heuristic and conservative; DO NOT use 90–100% unless imprint + color + shape together are an exact match.

  FEATURES TO EXTRACT (in this mental order): shape → color → size (approx mm) → imprint (text/logos; partial allowed) → scoring (break lines) → surface (matte/glossy) → special features (e.g., time-release).

  CONFIDENCE BANDS:
  - 90–100%: exact imprint + shape + color alignment
  - 70–89%: strong match with minor uncertainty
  - 50–69%: reasonable guess on partial info
  - 0–10%: unknown/ambiguous

  OUTPUT RULES:
  - Return EXACTLY 3 results, ordered by confidence (highest first).
  - Each result must include: name, genericName, brandName, confidence, imprint, shape, color, size, scoring, description.
  - "description" must be a detailed reasoning (at least 3 sentences). It should explain:
    (a) which features matched clearly,
    (b) which features were unclear or missing, and
    (c) how the combination of medical context (if provided) and observed features led to the assigned confidence score, and
    (d) what this medicine is commonly used for.

  ${context}
  `.trim();
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
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
    const medicalInfo = formData.get("medicalInfo") as string | null;

  // Build and log the prompt
  const promptText = buildPrompt(medicalInfo);

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image." },
        { status: 400 }
      );
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Please upload an image under 10MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // 4) Call model with system guardrails + user content
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: PillIdentificationSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: promptText,
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

    // 5) Always return schema-validated object
    return NextResponse.json(result.object);
  } catch (error: unknown) {
    console.error("Error analyzing pill:", error);
    console.error("Error details:", {
      message:
        isErrorWithProps(error) && typeof error.message === "string"
          ? error.message
          : String(error),
      code:
        isErrorWithProps(error) && typeof error.code === "string"
          ? error.code
          : undefined,
      type:
        isErrorWithProps(error) && typeof error.type === "string"
          ? error.type
          : undefined,
      status:
        isErrorWithProps(error) && typeof error.status === "number"
          ? error.status
          : undefined,
    });

    // Common failure buckets
    if (
      (isErrorWithProps(error) &&
        typeof error.message === "string" &&
        error.message.toLowerCase().includes("timeout")) ||
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
      (isErrorWithProps(error) && error.code === "insufficient_quota") ||
      (isErrorWithProps(error) && error.status === 429)
    ) {
      return NextResponse.json(
        { error: "OpenAI API quota exceeded. Please check usage and billing." },
        { status: 429 }
      );
    } else if (
      (isErrorWithProps(error) && error.code === "invalid_api_key") ||
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
      (isErrorWithProps(error) && error.code === "model_not_found") ||
      (isErrorWithProps(error) && error.status === 404)
    ) {
      return NextResponse.json(
        { error: "OpenAI model not found or unavailable." },
        { status: 404 }
      );
    } else if (
      (isErrorWithProps(error) &&
        typeof error.message === "string" &&
        error.message.toLowerCase().includes("network")) ||
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

    // Fallback
    return NextResponse.json(
      {
        error: `Failed to analyze pill image: ${
          isErrorWithProps(error) && typeof error.message === "string"
            ? error.message
            : "Unknown error"
        }`,
        details:
          (isErrorWithProps(error) && error.code) ||
          (isErrorWithProps(error) && error.type) ||
          "No additional details",
      },
      { status: 500 }
    );
  }
}
