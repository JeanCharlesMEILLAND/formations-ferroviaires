import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorizedResponse } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  if (!verifyAuth()) return unauthorizedResponse();
  try {
    const body = await request.json();
    const link = await prisma.establishmentFormation.create({
      data: {
        establishmentId: body.establishmentId,
        formationId: body.formationId,
      },
    });
    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error("Error creating link:", error);
    return NextResponse.json(
      { error: "Failed to create link" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!verifyAuth()) return unauthorizedResponse();
  try {
    const { searchParams } = new URL(request.url);
    const establishmentId = searchParams.get("establishmentId");
    const formationId = searchParams.get("formationId");
    if (!establishmentId || !formationId) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }
    await prisma.establishmentFormation.delete({
      where: {
        establishmentId_formationId: { establishmentId, formationId },
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting link:", error);
    return NextResponse.json(
      { error: "Failed to delete link" },
      { status: 500 }
    );
  }
}
