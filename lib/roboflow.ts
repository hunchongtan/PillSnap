export interface RoboflowDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
  class_id: number;
}

export interface RoboflowResponse {
  time: number;
  image: {
    width: number;
    height: number;
  };
  predictions: RoboflowDetection[];
}

export interface ProcessedPillImage {
  originalImageUrl: string;
  segmentedImageUrl?: string;
  detections: RoboflowDetection[];
  confidence: number;
}

export async function segmentPillImage(
  imageFile: File
): Promise<ProcessedPillImage> {
  try {
    // Convert file to base64 for Roboflow API
    const base64Image = await fileToBase64(imageFile);

    // Create FormData for Roboflow API
    const formData = new FormData();
    formData.append("file", imageFile);

    // Call Roboflow API endpoint
    const response = await fetch("/api/segment", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Roboflow API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result as ProcessedPillImage;
  } catch (error) {
    console.error("[v0] Roboflow segmentation error:", error);
    throw new Error("Failed to segment pill image");
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

export function drawBoundingBoxes(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  detections: RoboflowDetection[]
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Set canvas size to match image
  canvas.width = image.width;
  canvas.height = image.height;

  // Draw the original image
  ctx.drawImage(image, 0, 0);

  // Draw bounding boxes
  ctx.strokeStyle = "#6366f1";
  ctx.lineWidth = 3;
  ctx.font = "16px Arial";
  ctx.fillStyle = "#6366f1";

  detections.forEach((detection) => {
    const { x, y, width, height, confidence, class: className } = detection;

    // Draw bounding box
    ctx.strokeRect(x - width / 2, y - height / 2, width, height);

    // Draw label background
    const label = `${className} (${(confidence * 100).toFixed(1)}%)`;
    const textMetrics = ctx.measureText(label);
    const textHeight = 20;

    ctx.fillStyle = "#6366f1";
    ctx.fillRect(
      x - width / 2,
      y - height / 2 - textHeight,
      textMetrics.width + 8,
      textHeight
    );

    // Draw label text
    ctx.fillStyle = "white";
    ctx.fillText(label, x - width / 2 + 4, y - height / 2 - 4);
  });
}
