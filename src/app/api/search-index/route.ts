import { NextResponse } from "next/server";
import { getSearchIndex } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Index des suggestions de recherche (établissements vérifiés, formations, métiers, villes), dix minutes au CDN. */
export async function GET() {
  try {
    const data = await getSearchIndex();
    return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400" } });
  } catch (error) {
    console.error("Error building search index:", error);
    return NextResponse.json({ error: "Failed to build search index" }, { status: 500 });
  }
}
