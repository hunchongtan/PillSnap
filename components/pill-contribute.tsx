"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, CheckCircle, AlertCircle } from "lucide-react"

export function PillContribute() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [frontImage, setFrontImage] = useState<File | null>(null)
  const [backImage, setBackImage] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    imprint: "",
    shape: "",
    color: "",
    scored: "",
    dosageForm: "",
    strength: "",
    brandGeneric: "",
    manufacturer: "",
  })

  const handleImageUpload = (file: File, side: "front" | "back") => {
    if (side === "front") {
      setFrontImage(file)
    } else {
      setBackImage(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!frontImage) {
      setError("Front image is required")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("frontImage", frontImage)
      if (backImage) {
        formDataToSend.append("backImage", backImage)
      }

      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value)
      })

      const response = await fetch("/api/contribute", {
        method: "POST",
        body: formDataToSend,
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to submit contribution")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
          <p className="text-muted-foreground">
            Your pill contribution has been submitted for review. It will be published after approval by our team.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Contribute Pill Images</CardTitle>
        <p className="text-muted-foreground">
          Help improve our database by contributing high-quality pill images and information.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Uploads */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="front-image">Front Image *</Label>
              <div className="mt-2">
                <input
                  id="front-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "front")}
                  className="hidden"
                />
                <label
                  htmlFor="front-image"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors"
                >
                  {frontImage ? (
                    <div className="text-center">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <span className="text-sm">{frontImage.name}</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <span className="text-sm text-muted-foreground">Upload front image</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="back-image">Back Image (Optional)</Label>
              <div className="mt-2">
                <input
                  id="back-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "back")}
                  className="hidden"
                />
                <label
                  htmlFor="back-image"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors"
                >
                  {backImage ? (
                    <div className="text-center">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <span className="text-sm">{backImage.name}</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <span className="text-sm text-muted-foreground">Upload back image</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="imprint">Imprint</Label>
              <Input
                id="imprint"
                value={formData.imprint}
                onChange={(e) => setFormData({ ...formData, imprint: e.target.value })}
                placeholder="e.g., ADVIL, L544"
              />
            </div>

            <div>
              <Label htmlFor="shape">Shape</Label>
              <Select value={formData.shape} onValueChange={(value) => setFormData({ ...formData, shape: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shape" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round">Round</SelectItem>
                  <SelectItem value="oval">Oval</SelectItem>
                  <SelectItem value="capsule">Capsule</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="rectangular">Rectangular</SelectItem>
                  <SelectItem value="triangular">Triangular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="color">Color</Label>
              <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                  <SelectItem value="pink">Pink</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="scored">Scored</Label>
              <Select value={formData.scored} onValueChange={(value) => setFormData({ ...formData, scored: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Is it scored?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dosageForm">Dosage Form</Label>
              <Select
                value={formData.dosageForm}
                onValueChange={(value) => setFormData({ ...formData, dosageForm: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dosage form" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tablet">Tablet</SelectItem>
                  <SelectItem value="capsule">Capsule</SelectItem>
                  <SelectItem value="caplet">Caplet</SelectItem>
                  <SelectItem value="softgel">Softgel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="strength">Strength</Label>
              <Input
                id="strength"
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                placeholder="e.g., 200mg, 10/325mg"
              />
            </div>

            <div>
              <Label htmlFor="brandGeneric">Brand/Generic</Label>
              <Input
                id="brandGeneric"
                value={formData.brandGeneric}
                onChange={(e) => setFormData({ ...formData, brandGeneric: e.target.value })}
                placeholder="e.g., Advil, Ibuprofen"
              />
            </div>

            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="e.g., Pfizer, Teva"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Submitting..." : "Submit Contribution"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
