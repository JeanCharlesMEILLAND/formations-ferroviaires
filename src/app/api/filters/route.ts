import { NextResponse } from "next/server";
import {
  getRegions,
  getEstablishmentTypes,
  getFormationLevels,
  getFormationDomains,
  getMetiers,
  getFormationsForFilter,
  getMetierFormationLinks,
} from "@/lib/data";

export const dynamic = "force-dynamic"; // toujours lu en base, jamais figé au build

export async function GET() {
  try {
    const [regions, types, levels, domains, metiers, formations, metierFormationLinks] = await Promise.all([
      getRegions(),
      getEstablishmentTypes(),
      getFormationLevels(),
      getFormationDomains(),
      getMetiers(),
      getFormationsForFilter(),
      getMetierFormationLinks(),
    ]);
    return NextResponse.json({ regions, types, levels, domains, metiers, formations, metierFormationLinks }, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400" } });
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json(
      { error: "Failed to fetch filters" },
      { status: 500 }
    );
  }
}
