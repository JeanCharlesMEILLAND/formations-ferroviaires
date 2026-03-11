import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorizedResponse } from "@/lib/admin-auth";

export async function GET() {
  if (!verifyAuth()) return unauthorizedResponse();
  const formations = await prisma.formation.findMany({
    include: {
      level: true,
      domain: true,
      establishments: {
        include: {
          establishment: { select: { id: true, name: true, city: true } },
        },
      },
      metiers: {
        include: {
          metier: { select: { id: true, nameFr: true } },
        },
      },
    },
    orderBy: [{ level: { order: "asc" } }, { nameFr: "asc" }],
  });
  return NextResponse.json(formations);
}

export async function POST(request: NextRequest) {
  if (!verifyAuth()) return unauthorizedResponse();
  try {
    const body = await request.json();
    const slug = body.nameFr
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const formation = await prisma.formation.create({
      data: {
        slug,
        nameFr: body.nameFr,
        nameEn: body.nameEn || null,
        rncpCode: body.rncpCode || null,
        onisepUrl: body.onisepUrl || null,
        levelId: body.levelId,
        domainId: body.domainId,
        jobTarget: body.jobTarget || null,
      },
      include: { level: true, domain: true },
    });
    return NextResponse.json(formation, { status: 201 });
  } catch (error) {
    console.error("Error creating formation:", error);
    return NextResponse.json(
      { error: "Failed to create formation" },
      { status: 500 }
    );
  }
}
