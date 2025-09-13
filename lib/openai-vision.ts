export interface ExtractedPillAttributes {
  shape?: string;
  color?: string;
  size_mm?: number;
  front_imprint?: string;
  back_imprint?: string;
  coating?: string;
  scoring?: string;
  scored?: boolean; // Added this property
  confidence: number;
  reasoning: string;
}

export interface VisionAnalysisResult {
  attributes: ExtractedPillAttributes;
  rawResponse: string;
}

export async function extractPillAttributes(
  imageFile: File
): Promise<VisionAnalysisResult> {
  try {
    console.log("[extractPillAttributes] Starting base64 conversion...");
    const base64Image = await fileToBase64(imageFile);
    console.log("[extractPillAttributes] Base64 conversion complete.");

    console.log(
      "[extractPillAttributes] Sending request to OpenAI Vision API..."
    );
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Image,
        mimeType: imageFile.type,
      }),
    });

    console.log("[extractPillAttributes] Request payload:", {
      image: "[base64 omitted]",
      mimeType: imageFile.type,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[extractPillAttributes] OpenAI Vision API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`OpenAI Vision API error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("[extractPillAttributes] OpenAI Vision API response:", result);
    return result as VisionAnalysisResult;
  } catch (error) {
    console.error("[extractPillAttributes] OpenAI Vision analysis error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
    });
    throw new Error("Failed to analyze pill attributes. See logs for details.");
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/jpeg;base64, prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

export const PILL_ANALYSIS_PROMPT = `
You are a pharmaceutical expert analyzing a pill image. Extract the following attributes with high precision:

1. **Shape**: Round, Oval, Capsule, Square, Diamond, Triangle, or Other
2. **Color**: Primary color(s) - be specific (e.g., "Light Blue", "White", "Pink", "Orange")
3. **Size**: Estimate diameter/length in millimeters (common range: 4-25mm)
4. **Front Imprint**: Any text, numbers, or symbols on the front side
5. **Back Imprint**: Any text, numbers, or symbols on the back side (if visible)
6. **Coating**: Uncoated, Film-coated, Sugar-coated, Enteric-coated, or Unknown
7. **Scoring**: None, Single score, Cross score, Multiple scores, or Unknown

Respond in JSON format:
{
  "shape": "string",
  "color": "string", 
  "size_mm": number,
  "front_imprint": "string",
  "back_imprint": "string",
  "coating": "string",
  "scoring": "string",
  "confidence": number (0-1),
  "reasoning": "Brief explanation of your analysis"
}

Be conservative with confidence scores. Only use high confidence (>0.8) when features are clearly visible.
If an attribute cannot be determined, use null for the value and mention it in reasoning.
`;
