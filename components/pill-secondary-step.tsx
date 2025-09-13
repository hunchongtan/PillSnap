"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search } from "lucide-react"

type SecondaryAttributes = {
  suspected_name: string
  manufacturer: string
  strength: string
  indication: string
  country: string
  notes: string
}

interface PillSecondaryStepProps {
  onComplete: (attributes: SecondaryAttributes) => void
  initialAttributes?: Partial<SecondaryAttributes>
}

const COUNTRIES = ["SG", "US", "CA", "GB", "AU", "DE", "FR", "JP", "IN", "Other"]

export function PillSecondaryStep({ onComplete, initialAttributes = {} }: PillSecondaryStepProps) {
  const [attributes, setAttributes] = useState<SecondaryAttributes>({
    suspected_name: "",
    manufacturer: "",
    strength: "",
    indication: "",
    country: "SG",
    notes: "",
    ...initialAttributes,
  })

  const handleSubmit = () => {
    onComplete(attributes)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Secondary Attributes (Optional)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="suspected-name">Suspected Generic/Brand Name</Label>
            <Input
              id="suspected-name"
              value={attributes.suspected_name}
              onChange={(e) => setAttributes((prev) => ({ ...prev, suspected_name: e.target.value }))}
              placeholder="e.g., Aspirin, Tylenol"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manufacturer">Manufacturer</Label>
            <Input
              id="manufacturer"
              value={attributes.manufacturer}
              onChange={(e) => setAttributes((prev) => ({ ...prev, manufacturer: e.target.value }))}
              placeholder="e.g., Pfizer, GSK"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="strength">Strength</Label>
            <Input
              id="strength"
              value={attributes.strength}
              onChange={(e) => setAttributes((prev) => ({ ...prev, strength: e.target.value }))}
              placeholder="e.g., 500mg, 10mg"
            />
          </div>

          <div className="space-y-2">
            <Label>Country/Market</Label>
            <Select
              value={attributes.country}
              onValueChange={(value) => setAttributes((prev) => ({ ...prev, country: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="indication">Indication/Condition</Label>
          <Input
            id="indication"
            value={attributes.indication}
            onChange={(e) => setAttributes((prev) => ({ ...prev, indication: e.target.value }))}
            placeholder="e.g., Pain relief, Blood pressure"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={attributes.notes}
            onChange={(e) => setAttributes((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Any additional information..."
            rows={3}
          />
        </div>

        <Button onClick={handleSubmit} className="w-full">
          <Search className="w-4 h-4 mr-2" />
          Re-rank Results
        </Button>
      </CardContent>
    </Card>
  )
}
