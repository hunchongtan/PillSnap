// /app/api/analyze/route.ts
import { type NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { env } from "@/lib/env";
import { z } from "zod";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

// Narrow unknown errors
function isErrorWithProps(
  e: unknown
): e is { message?: string; code?: string; type?: string; status?: number } {
  return typeof e === "object" && e !== null;
}

// === Schema: attributes-only ===
const PillAttributesSchema = z
  .object({
    shape: z.string().default("unclear"),
    color: z.string().default("unclear"),
    size_mm: z.coerce.number().min(0).default(0),
    thickness_mm: z.coerce.number().min(0).default(0),
    front_imprint: z.string().default("unclear"),
    back_imprint: z.string().default("unclear"),
    coating: z.string().default("unclear"), // matte/glossy/film-coated/unclear
    scoring: z.string().default("unclear"), // "none", "1 score", "2 scores", or "unclear"
    notes: z.string().default(""), // free text like "partial 'M' visible"
  })
  .strict();

const OutputSchema = z
  .object({
    attributes: PillAttributesSchema,
  })
  .strict();

// === Prompt ===
function buildPrompt() {
  return `
Extract ONLY visible attributes of the clearest pill in the image. If unclear, write "unclear".
If a numeric value is uncertain, use a reasonable mm estimate or 0.

You MUST return a single JSON object with this exact shape (valid JSON, no comments, no extra keys):
{
  "attributes": {
    "shape": string,
    "color": string,
    "size_mm": number,
    "thickness_mm": number,
    "front_imprint": string,
    "back_imprint": string,
    "coating": string,
    "scoring": string,
    "notes": string
  }
}

Guidelines:
- size_mm = longest dimension; thickness_mm = height.
- Imprint can be partial (e.g., "M", "PA"); if none, "unclear".
- coating: matte/glossy/film-coated/unclear.
- scoring: "none", "1 score", "2 scores", or "unclear".
- Do NOT identify the medicine. Do NOT include extra fields. Output JSON only.
`.trim();
}

export async function POST(request: NextRequest) {
  try {
    // env is already validated at import time

    if (!request.headers.get("content-type")?.startsWith("application/json")) {
      return NextResponse.json(
        { error: "Invalid Content-Type. Expected 'application/json'." },
        { status: 400 }
      );
    }

    const { image, mimeType } = (await request.json()) as {
      image?: string; // base64 (no prefix)
      mimeType?: string; // e.g., "image/jpeg"
    };

    if (!image) {
      return NextResponse.json(
        { error: "No image provided." },
        { status: 400 }
      );
    }
    if (!mimeType || !mimeType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid mimeType. Please provide an image mime type." },
        { status: 400 }
      );
    }

    // Build data URL for multimodal block (do NOT paste into text)
    const dataUrl = `data:${mimeType};base64,${image}`;
    const prompt = buildPrompt();

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" }, // require valid JSON
      messages: [
        {
          role: "system",
          content:
            "You are a vision assistant. Output valid JSON only. Do not include any text outside of the JSON.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt }, // contains the word "JSON" to satisfy API requirement
            { type: "image_url", image_url: { url: dataUrl } },
          ] as any,
        },
      ],
    });

    const raw = resp.choices[0]?.message?.content ?? "{}";
    const parsed = OutputSchema.parse(JSON.parse(raw));

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("Error analyzing pill:", error);

    const message =
      isErrorWithProps(error) && typeof error.message === "string"
        ? error.message
        : String(error);

    // Specific buckets
    if (isErrorWithProps(error) && error.code === "context_length_exceeded") {
      return NextResponse.json(
        {
          error:
            "Context too large. Ensure you are not embedding base64 inside text; use image_url blocks.",
        },
        { status: 400 }
      );
    }
    if (
      isErrorWithProps(error) &&
      (error.code === "insufficient_quota" || error.status === 429)
    ) {
      return NextResponse.json(
        { error: "OpenAI API quota exceeded." },
        { status: 429 }
      );
    }
    if (
      isErrorWithProps(error) &&
      (error.code === "invalid_api_key" || error.status === 401)
    ) {
      return NextResponse.json(
        { error: "Invalid OpenAI API key." },
        { status: 401 }
      );
    }
    if (
      isErrorWithProps(error) &&
      (error.code === "model_not_found" || error.status === 404)
    ) {
      return NextResponse.json(
        { error: "OpenAI model not found or unavailable." },
        { status: 404 }
      );
    }
    if (
      isErrorWithProps(error) &&
      (message.toLowerCase().includes("timeout") || error.code === "TIMEOUT")
    ) {
      return NextResponse.json(
        { error: "Request timed out. Try a smaller image or retry." },
        { status: 408 }
      );
    }
    if (
      isErrorWithProps(error) &&
      (message.toLowerCase().includes("network") || error.code === "ENOTFOUND")
    ) {
      return NextResponse.json(
        { error: "Network error. Please check connectivity and retry." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: `Failed to analyze pill image: ${message}` },
      { status: 500 }
    );
  }
}
