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
    return NextResponse.json({ regions, types, levels, domains, metiers, formations, metierFormationLinks });
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json(
      { error: "Failed to fetch filters" },
      { status: 500 }
    );
  }
}
