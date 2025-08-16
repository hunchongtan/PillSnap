export interface PillIdentification {
  name: string
  genericName: string
  brandName: string
  confidence: number
  imprint: string
  shape: string
  color: string
  size: string
  scoring: string
  description: string
}

export interface DetectedPill {
  id: number
  boundingBox: { x: number; y: number; width: number; height: number }
  confidence: number
  croppedImage: string
}

export interface ClassifiedPill {
  pillId: number
  boundingBox: { x: number; y: number; width: number; height: number }
  detectionConfidence: number
  identifications: PillIdentification[]
  thumbnail: string
  status: "success" | "failed" | "low-confidence"
  error?: string
}

export interface MultiPillResults {
  success: boolean
  pillCount: number
  pillResults: ClassifiedPill[]
  processingTime: number
  originalImage: {
    name: string
    size: number
    type: string
  }
}

/**
 * Orchestrates the multi-pill identification workflow
 */
export class MultiPillClassifier {
  private maxConcurrentRequests = 3 // Limit concurrent API calls

  /**
   * Main workflow: detect pills, then classify each one
   */
  async processImage(imageFile: File): Promise<MultiPillResults> {
    const startTime = Date.now()

    try {
      // Step 1: Detect all pills in the image
      const detectionResults = await this.detectPills(imageFile)

      if (!detectionResults.success || detectionResults.pillCount === 0) {
        return {
          success: false,
          pillCount: 0,
          pillResults: [],
          processingTime: Date.now() - startTime,
          originalImage: {
            name: imageFile.name,
            size: imageFile.size,
            type: imageFile.type,
          },
        }
      }

      // Step 2: Classify each detected pill in parallel (with concurrency limit)
      const classificationResults = await this.classifyDetectedPills(imageFile, detectionResults.detections)

      return {
        success: true,
        pillCount: classificationResults.length,
        pillResults: classificationResults,
        processingTime: Date.now() - startTime,
        originalImage: {
          name: imageFile.name,
          size: imageFile.size,
          type: imageFile.type,
        },
      }
    } catch (error) {
      console.error("Error in multi-pill processing:", error)
      throw error
    }
  }

  /**
   * Detect pills in the uploaded image using Roboflow
   */
  private async detectPills(
    imageFile: File,
  ): Promise<{ success: boolean; pillCount: number; detections: DetectedPill[] }> {
    const formData = new FormData()
    formData.append("file", imageFile)

    const response = await fetch("/api/detect", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Detection failed: ${response.status}`)
    }

    const roboflowResult = await response.json()

    if (!roboflowResult.predictions || roboflowResult.predictions.length === 0) {
      return { success: false, pillCount: 0, detections: [] }
    }

    const detections: DetectedPill[] = roboflowResult.predictions.map((p: Record<string, unknown>, index: number) => {
      if (
        typeof p.x !== 'number' ||
        typeof p.y !== 'number' ||
        typeof p.width !== 'number' ||
        typeof p.height !== 'number'
      ) {
        throw new Error('Invalid prediction object from Roboflow');
      }
      const topLeftX = p.x - p.width / 2
      const topLeftY = p.y - p.height / 2

      const boundingBox = {
        x: topLeftX,
        y: topLeftY,
        width: p.width,
        height: p.height,
      }

      return {
        id: index + 1,
        boundingBox: boundingBox,
        confidence: p.confidence,
        croppedImage: "", // This will be generated on the server
      }
    })

    return {
      success: true,
      pillCount: detections.length,
      detections: detections,
    }
  }

  /**
   * Classify multiple detected pills with concurrency control
   */
  private async classifyDetectedPills(
    imageFile: File,
    detections: DetectedPill[],
  ): Promise<ClassifiedPill[]> {
    const results: ClassifiedPill[] = []

    // Process pills in batches to avoid overwhelming the API
    for (let i = 0; i < detections.length; i += this.maxConcurrentRequests) {
      const batch = detections.slice(i, i + this.maxConcurrentRequests)

      const batchPromises = batch.map(async (detection) => {
        try {
          const classification = await this.classifySinglePill(imageFile, detection)
          return classification
        } catch (error) {
          console.error(`Error classifying pill ${detection.id}:`, error)
          return {
            pillId: detection.id,
            boundingBox: detection.boundingBox,
            detectionConfidence: detection.confidence,
            identifications: [],
            thumbnail: "", // No thumbnail available on failure
            status: "failed" as const,
            error: error instanceof Error ? error.message : "Classification failed",
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }

    return results
  }

  /**
   * Gets a cropped image from the server.
   */
  private async getCroppedImage(
    imageFile: File,
    boundingBox: DetectedPill["boundingBox"],
  ): Promise<string> {
    const formData = new FormData()
    formData.append("image", imageFile)
    formData.append("box", JSON.stringify(boundingBox))

    const response = await fetch("/api/crop", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to crop image: ${response.status}`)
    }

    const result = await response.json()
    return result.croppedImage
  }

  /**
   * Classify a single detected pill
   */
  private async classifySinglePill(
    imageFile: File,
    detection: DetectedPill,
  ): Promise<ClassifiedPill> {
    // Step 1: Get the cropped image from the server
    const croppedImage = await this.getCroppedImage(imageFile, detection.boundingBox)
    const detectionWithThumbnail = { ...detection, croppedImage }

    // Step 2: Send the cropped image for analysis
    const response = await fetch("/api/analyze-pill", {
      method: "POST",
      body: this.createFormDataFromDetection(detectionWithThumbnail),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Classification failed: ${response.status}`)
    }

    const data = await response.json()

    // Determine status based on results
    let status: "success" | "failed" | "low-confidence" = "success"
    if (!data.results || data.results.length === 0) {
      status = "failed"
    } else if (data.results[0].confidence < 70) {
      status = "low-confidence"
    }

    return {
      pillId: detection.id,
      boundingBox: detection.boundingBox,
      detectionConfidence: detection.confidence,
      identifications: data.results || [],
      thumbnail: croppedImage,
      status,
    }
  }

  /**
   * Convert detection data to FormData for API call
   */
  private createFormDataFromDetection(detection: DetectedPill): FormData {
    try {
      // Handle base64 data URL format
      let base64Data = detection.croppedImage

      if (base64Data.startsWith("data:")) {
        const base64Index = base64Data.indexOf(",")
        if (base64Index !== -1) {
          base64Data = base64Data.substring(base64Index + 1)
        }
      }

      base64Data = base64Data.replace(/[^A-Za-z0-9+/=]/g, "")

      if (base64Data.length === 0) {
        throw new Error("Empty base64 data")
      }

      while (base64Data.length % 4 !== 0) {
        base64Data += "="
      }

      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }

      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: "image/jpeg" })
      const file = new File([blob], `pill-${detection.id}.jpg`, { type: "image/jpeg" })

      const formData = new FormData()
      formData.append("image", file)

      return formData
    } catch (error) {
      console.error(`Error creating FormData for pill ${detection.id}:`, error)
      throw new Error(
        `Invalid image data for pill ${detection.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  /**
   * Check if single pill workflow should be used
   */
  static shouldUseSinglePillWorkflow(pillCount: number): boolean {
    return pillCount === 1
  }

  /**
   * Get processing statistics
   */
  static getProcessingStats(results: MultiPillResults) {
    const successful = results.pillResults.filter((p) => p.status === "success").length
    const failed = results.pillResults.filter((p) => p.status === "failed").length
    const lowConfidence = results.pillResults.filter((p) => p.status === "low-confidence").length

    return {
      total: results.pillCount,
      successful,
      failed,
      lowConfidence,
      averageProcessingTime: results.processingTime / results.pillCount,
    }
  }
}

/**
 * Utility functions for multi-pill results
 */
export const MultiPillUtils = {
  /**
   * Get the best identification for a pill
   */
  getBestMatch(pill: ClassifiedPill): PillIdentification | null {
    if (pill.identifications.length === 0) return null
    return pill.identifications[0] // Already sorted by confidence
  },

  /**
   * Filter pills by confidence threshold
   */
  filterByConfidence(results: ClassifiedPill[], minConfidence: number): ClassifiedPill[] {
    return results.filter((pill) => {
      const bestMatch = this.getBestMatch(pill)
      return bestMatch && bestMatch.confidence >= minConfidence
    })
  },

  /**
   * Group pills by identification status
   */
  groupByStatus(results: ClassifiedPill[]) {
    return {
      identified: results.filter((p) => p.status === "success"),
      lowConfidence: results.filter((p) => p.status === "low-confidence"),
      failed: results.filter((p) => p.status === "failed"),
    }
  },

  /**
   * Generate summary text for results
   */
  generateSummary(results: MultiPillResults): string {
    const stats = MultiPillClassifier.getProcessingStats(results)

    if (stats.total === 0) {
      return "No pills detected in the image."
    }

    if (stats.total === 1) {
      const pill = results.pillResults[0]
      const bestMatch = this.getBestMatch(pill)

      if (pill.status === "success" && bestMatch) {
        return `Identified 1 pill: ${bestMatch.name} (${bestMatch.confidence}% confidence)`
      } else {
        return "1 pill detected but could not be identified with confidence."
      }
    }

    return `Detected ${stats.total} pills: ${stats.successful} identified, ${stats.lowConfidence} low confidence, ${stats.failed} failed.`
  },
}
