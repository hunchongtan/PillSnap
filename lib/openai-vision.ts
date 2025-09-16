export interface ExtractedPillAttributes {
  shape?: string
  color?: string
  size_mm?: number
  imprint?: string
  scoring?: string
  confidence: number
  reasoning: string
}

export interface VisionAnalysisResult {
  attributes: ExtractedPillAttributes
  rawResponse: string
}

export async function extractPillAttributes(imageFile: File): Promise<VisionAnalysisResult> {
  try {
    console.log('[extractPillAttributes] Starting base64 conversion...')
    const base64Image = await fileToBase64(imageFile)
    console.log('[extractPillAttributes] Base64 conversion complete.')

    console.log('[extractPillAttributes] Sending request to OpenAI Vision API...')
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        mimeType: imageFile.type,
      }),
    })

    console.log('[extractPillAttributes] Request payload:', {
      image: '[base64 omitted]',
      mimeType: imageFile.type,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[extractPillAttributes] OpenAI Vision API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      })
      throw new Error(`OpenAI Vision API error: ${response.statusText}`)
    }

    const result = await response.json()
    console.log('[extractPillAttributes] OpenAI Vision API response:', result)
    return result as VisionAnalysisResult
  } catch (error) {
    console.error('[extractPillAttributes] OpenAI Vision analysis error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
    })
    throw new Error('Failed to analyze pill attributes. See logs for details.')
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // Remove data:image/jpeg;base64, prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = (error) => reject(error)
  })
}

export const PILL_ANALYSIS_PROMPT = `
You are a pharmaceutical image analysis expert. Analyze the provided image of a pill and extract the following attributes with precision and caution:

1. **Shape**: Select only from the app’s predefined list of allowed shapes.
2. **Color**: Select only from the app’s predefined list of allowed colors.
3. **Size (mm)**: Estimate the diameter or length in millimeters, rounded to one decimal place.
4. **Imprint**: Identify any visible text, numbers, or symbols printed on the pill surface.
5. **Scoring**: Choose from "no score", "1 score", or "2 scores" based on visible score lines.

### Response Format (strict JSON):
\`\`\`json
{
  "shape": "string or null",
  "color": "string or null",
  "size_mm": number or null,
  "imprint": "string or null",
  "scoring": "string or null",
  "confidence": number (0.0 - 1.0),
  "reasoning": "Brief explanation justifying each extracted attribute and confidence level"
}
\`\`\`

### Additional Guidelines:
- Be **conservative with confidence scoring**. Use values > 0.6 **only if** the visual features are clearly and unambiguously visible.
- Use 'null' for any attribute that cannot be confidently determined and explain the uncertainty in the reasoning.
- Maintain strict adherence to the allowed values for shape and color; do not infer or hallucinate.

Return only the JSON response.
`
