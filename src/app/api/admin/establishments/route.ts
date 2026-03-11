import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const establishments = await prisma.establishment.findMany({
    include: {
      type: true,
      region: true,
      formations: {
        include: {
          formation: {
            include: { level: true, domain: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(establishments);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = body.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const establishment = await prisma.establishment.create({
      data: {
        slug,
        name: body.name,
        city: body.city,
        lat: parseFloat(body.lat),
        lng: parseFloat(body.lng),
        typeId: body.typeId,
        regionId: body.regionId,
        website: body.website || null,
        address: body.address || null,
        onisepUrl: body.onisepUrl || null,
      },
      include: { type: true, region: true },
    });
    return NextResponse.json(establishment, { status: 201 });
  } catch (error) {
    console.error("Error creating establishment:", error);
    return NextResponse.json(
      { error: "Failed to create establishment" },
      { status: 500 }
    );
  }
}
