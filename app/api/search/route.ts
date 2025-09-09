import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Pill } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { step1, step2 } = await req.json();

    if (!step1 || Object.keys(step1).length === 0) {
      return NextResponse.json({ error: "Step 1 attributes are required." }, { status: 400 });
    }

    const { imprint, shape, color, scored } = step1;

    const results = await prisma.pill.findMany({
      where: {
        imprint_norm: imprint ? { contains: imprint, mode: "insensitive" } : undefined,
        shape: shape || undefined,
        color: color || undefined,
        scored: scored !== undefined ? scored : undefined,
      },
      orderBy: [
        { imprint_norm: "asc" },
        { shape: "asc" },
        { color: "asc" },
      ],
    });

    const rankedResults = results.map((pill: Pill) => {
      let matchCount = 0;
      let totalAttributes = 0;

      if (imprint) {
        totalAttributes++;
        if (pill.imprint_norm?.toLowerCase().includes(imprint.toLowerCase())) {
          matchCount++;
        }
      }

      if (shape) {
        totalAttributes++;
        if (pill.shape === shape) {
          matchCount++;
        }
      }

      if (color) {
        totalAttributes++;
        if (pill.color === color) {
          matchCount++;
        }
      }

      if (scored !== undefined) {
        totalAttributes++;
        if (pill.scored === scored) {
          matchCount++;
        }
      }

      const matchPercentage = (matchCount / totalAttributes) * 100;

      return {
        ...pill,
        matchPercentage,
      };
    });

    return NextResponse.json({ results: rankedResults });
  } catch (error) {
    return NextResponse.json({ error: "Failed to perform search." }, { status: 500 });
  }
}
