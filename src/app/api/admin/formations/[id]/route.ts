import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorizedResponse } from "@/lib/admin-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAuth()) return unauthorizedResponse();
  try {
    const body = await request.json();
    const formation = await prisma.formation.update({
      where: { id: params.id },
      data: {
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
    return NextResponse.json(formation);
  } catch (error) {
    console.error("Error updating formation:", error);
    return NextResponse.json(
      { error: "Failed to update formation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAuth()) return unauthorizedResponse();
  try {
    await prisma.establishmentFormation.deleteMany({
      where: { formationId: params.id },
    });
    await prisma.metierFormation.deleteMany({
      where: { formationId: params.id },
    });
    await prisma.formation.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting formation:", error);
    return NextResponse.json(
      { error: "Failed to delete formation" },
      { status: 500 }
    );
  }
}
