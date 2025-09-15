import { createServerClient } from '@/lib/server'
import { type NextRequest, NextResponse } from 'next/server'
import { SHAPE_OPTIONS, COLOR_OPTIONS, SCORING_OPTIONS } from '@/constants/pill-options'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const formData = await request.formData()

    const frontImage = formData.get('frontImage') as File
    const backImage = formData.get('backImage') as File | null

    if (!frontImage) {
      return NextResponse.json({ error: 'Front image is required' }, { status: 400 })
    }

    // Upload images to Supabase Storage
    const timestamp = Date.now()
    const frontImageName = `contributions/${timestamp}_front_${frontImage.name}`
    const backImageName = backImage ? `contributions/${timestamp}_back_${backImage.name}` : null

    // Upload front image
    const { data: frontUpload, error: frontError } = await supabase.storage
      .from('pill-images')
      .upload(frontImageName, frontImage)

    if (frontError) {
      console.error('Front image upload error:', frontError)
      return NextResponse.json({ error: 'Failed to upload front image' }, { status: 500 })
    }

    // Upload back image if provided
    let backUpload = null
    if (backImage && backImageName) {
      const { data, error: backError } = await supabase.storage
        .from('pill-images')
        .upload(backImageName, backImage)

      if (backError) {
        console.error('Back image upload error:', backError)
        // Continue without back image
      } else {
        backUpload = data
      }
    }

    // Get public URLs
    const { data: frontUrl } = supabase.storage.from('pill-images').getPublicUrl(frontUpload.path)

    const backUrl = backUpload
      ? supabase.storage.from('pill-images').getPublicUrl(backUpload.path).data
      : null

    // Server-side validation using canonical constants
    const shapeValue = formData.get('shape') as string
    const colorValue = formData.get('color') as string
    const scoringValue = formData.get('scoring') as string
    if (shapeValue && !SHAPE_OPTIONS.includes(shapeValue as any)) {
      return NextResponse.json({ error: 'Invalid shape value' }, { status: 400 })
    }
    if (!COLOR_OPTIONS.includes(colorValue as any)) {
      return NextResponse.json({ error: 'Invalid color value' }, { status: 400 })
    }
    if (scoringValue && !SCORING_OPTIONS.includes(scoringValue as any)) {
      return NextResponse.json({ error: 'Invalid scoring value' }, { status: 400 })
    }

    // Insert pill data (MVP schema)
    const sizeMmRaw = formData.get('sizeMm') as string
    const pillData = {
      name: (formData.get('name') as string) || null,
      brand_name: (formData.get('brandName') as string) || null,
      manufacturer: (formData.get('manufacturer') as string) || null,
      imprint: (formData.get('imprint') as string) || null,
      shape: (formData.get('shape') as string) || null,
      color: (formData.get('color') as string) || null,
      size_mm: sizeMmRaw ? Number(sizeMmRaw) : null,
      scoring: (formData.get('scoring') as string) || null,
      image_url: frontUrl.publicUrl,
      back_image_url: backUrl?.publicUrl || null,
      created_at: new Date().toISOString(),
    } as any

  const { data, error } = await supabase.from('pills').insert([pillData]).select()

    if (error) {
      console.error('Database insert error:', error)
      return NextResponse.json({ error: 'Failed to save pill data' }, { status: 500 })
    }

    return NextResponse.json({ success: true, pill: data[0] })
  } catch (error) {
    console.error('Contribution error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
