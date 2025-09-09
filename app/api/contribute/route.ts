import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const pillData = await req.json();

    const {
      generic_name,
      brand_name,
      strength,
      dosage_form,
      imprint_raw,
      imprint_norm,
      shape,
      color,
      scored,
      image_url,
      image_url_back,
      manufacturer,
    } = pillData;

    const newPill = await prisma.pill.create({
      data: {
        generic_name,
        brand_name,
        strength,
        dosage_form,
        imprint_raw,
        imprint_norm,
        shape,
        color,
        scored,
        image_url,
        image_url_back,
        manufacturer,
        status: "PENDING_REVIEW",
      },
    });

    return NextResponse.json({ message: "Pill record submitted successfully.", pill: newPill });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit pill record." }, { status: 500 });
  }
}
