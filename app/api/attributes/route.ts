import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const GPT_MODEL = "gpt-4";

export async function POST(req: NextRequest) {
  try {
    const { croppedImages } = await req.json();

    if (!Array.isArray(croppedImages) || croppedImages.length === 0) {
      return NextResponse.json({ error: "No cropped images provided." }, { status: 400 });
    }

    const results = await Promise.all(
      croppedImages.map(async (image) => {
        const response = await openai.chat.completions.create({
          model: GPT_MODEL,
          messages: [
            {
              role: "system",
              content: "You are an AI assistant trained to extract pill attributes: imprint, shape, color, scored, size, dosage form.",
            },
            {
              role: "user",
              content: `Extract attributes from this image: ${image}`,
            },
          ],
        });

        return response.choices[0].message.content;
      })
    );

    return NextResponse.json({ attributes: results });
  } catch (error) {
    return NextResponse.json({ error: "Failed to extract attributes." }, { status: 500 });
  }
}
