import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const metiers = await prisma.metier.findMany({
    include: {
      formations: {
        include: {
          formation: { select: { id: true, nameFr: true, slug: true } },
        },
      },
    },
    orderBy: [{ family: "asc" }, { nameFr: "asc" }],
  });
  return NextResponse.json(metiers);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = body.nameFr
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const metier = await prisma.metier.create({
      data: {
        slug,
        nameFr: body.nameFr,
        nameEn: body.nameEn || null,
        family: body.family,
        source: body.source,
        level: body.level || null,
      },
    });
    return NextResponse.json(metier, { status: 201 });
  } catch (error) {
    console.error("Error creating metier:", error);
    return NextResponse.json(
      { error: "Failed to create metier" },
      { status: 500 }
    );
  }
}
