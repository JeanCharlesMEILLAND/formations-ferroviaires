import { NextRequest, NextResponse } from "next/server";
import { getEstablishments } from "@/lib/data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const filters = {
    type: searchParams.get("type") || undefined,
    region: searchParams.get("region") || undefined,
    domain: searchParams.get("domain") || undefined,
    level: searchParams.get("level") || undefined,
    search: searchParams.get("search") || undefined,
    metier: searchParams.get("metier") || undefined,
    formation: searchParams.get("formation") || undefined,
  };

  try {
    const establishments = await getEstablishments(filters);
    return NextResponse.json(establishments);
  } catch (error) {
    console.error("Error fetching establishments:", error);
    return NextResponse.json(
      { error: "Failed to fetch establishments" },
      { status: 500 }
    );
  }
}
