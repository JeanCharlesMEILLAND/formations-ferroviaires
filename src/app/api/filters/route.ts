import { NextResponse } from "next/server";
import {
  getRegions,
  getEstablishmentTypes,
  getFormationLevels,
  getFormationDomains,
  getMetiers,
  getFormationsForFilter,
} from "@/lib/data";

export async function GET() {
  try {
    const [regions, types, levels, domains, metiers, formations] = await Promise.all([
      getRegions(),
      getEstablishmentTypes(),
      getFormationLevels(),
      getFormationDomains(),
      getMetiers(),
      getFormationsForFilter(),
    ]);
    return NextResponse.json({ regions, types, levels, domains, metiers, formations });
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json(
      { error: "Failed to fetch filters" },
      { status: 500 }
    );
  }
}
