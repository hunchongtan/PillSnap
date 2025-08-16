export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface DetectedPill {
  id: number
  boundingBox: BoundingBox
  confidence: number
  croppedImage: string
}

/**
 * Converts a File to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove data URL prefix to get just the base64 data
      const base64 = result.split(",")[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Creates a canvas element for image processing
 */
export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  return canvas
}

/**
 * Loads an image from a File object
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Loads an image from base64 data
 */
export function loadImageFromBase64(base64: string, mimeType = "image/jpeg"): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = `data:${mimeType};base64,${base64}`
  })
}

/**
 * Crops a region from an image and returns as base64
 */
export function cropImageRegion(
  img: HTMLImageElement,
  boundingBox: BoundingBox,
  targetSize: { width: number; height: number } = { width: 224, height: 224 },
): string {
  const canvas = createCanvas(targetSize.width, targetSize.height)
  const ctx = canvas.getContext("2d")!

  // Set white background for better pill visibility
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, targetSize.width, targetSize.height)

  // Draw the cropped region, scaled to fit the target size
  ctx.drawImage(
    img,
    boundingBox.x,
    boundingBox.y,
    boundingBox.width,
    boundingBox.height,
    0,
    0,
    targetSize.width,
    targetSize.height,
  )

  // Return as base64 (remove data URL prefix)
  return canvas.toDataURL("image/jpeg", 0.9).split(",")[1]
}

/**
 * Preprocesses an image for optimal pill detection
 */
export function preprocessImageForDetection(img: HTMLImageElement): string {
  const canvas = createCanvas(img.width, img.height)
  const ctx = canvas.getContext("2d")!

  // Draw original image
  ctx.drawImage(img, 0, 0)

  // Get image data for processing
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  // Apply basic contrast enhancement
  for (let i = 0; i < data.length; i += 4) {
    // Enhance contrast for better edge detection
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    // Simple contrast enhancement
    const factor = 1.2
    data[i] = Math.min(255, Math.max(0, (r - 128) * factor + 128))
    data[i + 1] = Math.min(255, Math.max(0, (g - 128) * factor + 128))
    data[i + 2] = Math.min(255, Math.max(0, (b - 128) * factor + 128))
  }

  // Put processed image data back
  ctx.putImageData(imageData, 0, 0)

  // Return as base64
  return canvas.toDataURL("image/jpeg", 0.9).split(",")[1]
}

/**
 * Simulates pill detection using basic image analysis
 * In production, this would be replaced with actual computer vision
 */
export function simulatePillDetection(img: HTMLImageElement): DetectedPill[] {
  const canvas = createCanvas(img.width, img.height)
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(img, 0, 0)

  // For demo purposes, create mock detections based on image dimensions
  // In reality, this would use OpenCV, YOLO, or similar CV algorithms
  const detections: DetectedPill[] = []

  // Simulate finding 1-3 pills in different regions
  const numPills = Math.floor(Math.random() * 3) + 1

  for (let i = 0; i < numPills; i++) {
    const pillSize = Math.min(img.width, img.height) * (0.15 + Math.random() * 0.1) // 15-25% of image
    const x = Math.random() * (img.width - pillSize)
    const y = Math.random() * (img.height - pillSize)

    const boundingBox: BoundingBox = {
      x: Math.floor(x),
      y: Math.floor(y),
      width: Math.floor(pillSize),
      height: Math.floor(pillSize),
    }

    // Crop the detected region
    const croppedImage = cropImageRegion(img, boundingBox)

    detections.push({
      id: i + 1,
      boundingBox,
      confidence: 0.7 + Math.random() * 0.25, // 70-95% confidence
      croppedImage,
    })
  }

  return detections
}

/**
 * Validates image dimensions and quality for pill detection
 */
export function validateImageForDetection(img: HTMLImageElement): { valid: boolean; message?: string } {
  const minWidth = 200
  const minHeight = 200
  const maxWidth = 4000
  const maxHeight = 4000

  if (img.width < minWidth || img.height < minHeight) {
    return {
      valid: false,
      message: `Image too small. Minimum size is ${minWidth}x${minHeight} pixels.`,
    }
  }

  if (img.width > maxWidth || img.height > maxHeight) {
    return {
      valid: false,
      message: `Image too large. Maximum size is ${maxWidth}x${maxHeight} pixels.`,
    }
  }

  return { valid: true }
}

/**
 * Calculates optimal crop padding for pill regions
 */
export function calculateOptimalPadding(
  boundingBox: BoundingBox,
  imageSize: { width: number; height: number },
): BoundingBox {
  const padding = Math.max(boundingBox.width, boundingBox.height) * 0.1 // 10% padding

  return {
    x: Math.max(0, boundingBox.x - padding),
    y: Math.max(0, boundingBox.y - padding),
    width: Math.min(imageSize.width - boundingBox.x, boundingBox.width + padding * 2),
    height: Math.min(imageSize.height - boundingBox.y, boundingBox.height + padding * 2),
  }
}
