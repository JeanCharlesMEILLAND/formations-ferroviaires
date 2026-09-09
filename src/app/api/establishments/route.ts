import { NextRequest, NextResponse } from "next/server";
import { getEstablishments, getEstablishmentsSlim } from "@/lib/data";

export const dynamic = "force-dynamic";
/** Dix minutes au CDN, un jour en réserve : la carte s'ouvre sans attendre la base, qui s'endort entre deux visites. */
const CACHE = "public, s-maxage=600, stale-while-revalidate=86400";

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
  const filtered = Object.values(filters).some(Boolean);
  try {
    // Sans filtre : la forme compacte que la carte charge une fois. Avec filtres : l'ancienne réponse détaillée.
    const data = filtered ? await getEstablishments(filters) : await getEstablishmentsSlim();
    return NextResponse.json(data, { headers: { "Cache-Control": CACHE } });
  } catch (error) {
    console.error("Error fetching establishments:", error);
    return NextResponse.json({ error: "Failed to fetch establishments" }, { status: 500 });
  }
}
