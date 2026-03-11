import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const link = await prisma.metierFormation.create({
      data: {
        metierId: body.metierId,
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
  try {
    const { searchParams } = new URL(request.url);
    const metierId = searchParams.get("metierId");
    const formationId = searchParams.get("formationId");
    if (!metierId || !formationId) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }
    await prisma.metierFormation.delete({
      where: {
        metierId_formationId: { metierId, formationId },
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
