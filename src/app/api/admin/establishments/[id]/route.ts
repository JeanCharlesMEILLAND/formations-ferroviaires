import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const establishment = await prisma.establishment.update({
      where: { id: params.id },
      data: {
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
    return NextResponse.json(establishment);
  } catch (error) {
    console.error("Error updating establishment:", error);
    return NextResponse.json(
      { error: "Failed to update establishment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.establishmentFormation.deleteMany({
      where: { establishmentId: params.id },
    });
    await prisma.establishment.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting establishment:", error);
    return NextResponse.json(
      { error: "Failed to delete establishment" },
      { status: 500 }
    );
  }
}
