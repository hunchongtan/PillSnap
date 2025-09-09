import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Pill ID is required." }, { status: 400 });
    }

    const updatedPill = await prisma.pill.update({
      where: { id: Number(id) },
      data: { status: "PUBLISHED" },
    });

    return NextResponse.json({ message: "Pill record approved successfully.", pill: updatedPill });
  } catch (error) {
    return NextResponse.json({ error: "Failed to approve pill record." }, { status: 500 });
  }
}
