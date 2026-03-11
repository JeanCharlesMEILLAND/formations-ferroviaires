import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const metier = await prisma.metier.update({
      where: { id: params.id },
      data: {
        nameFr: body.nameFr,
        nameEn: body.nameEn || null,
        family: body.family,
        source: body.source,
        level: body.level || null,
      },
    });
    return NextResponse.json(metier);
  } catch (error) {
    console.error("Error updating metier:", error);
    return NextResponse.json(
      { error: "Failed to update metier" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.metierFormation.deleteMany({
      where: { metierId: params.id },
    });
    await prisma.metier.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting metier:", error);
    return NextResponse.json(
      { error: "Failed to delete metier" },
      { status: 500 }
    );
  }
}
