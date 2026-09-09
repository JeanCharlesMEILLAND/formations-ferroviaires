import { NextRequest, NextResponse } from "next/server";
import { getSelectionData } from "@/lib/selection-data";
import { buildSelectionPdf } from "@/lib/selection-pdf";
import { loadPdfFonts } from "@/lib/pdf-fonts";

export const dynamic = "force-dynamic";

/** Liste à emporter : GET /api/selection/pdf?s=slug1,slug2&locale=fr */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slugs = (searchParams.get("s") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const locale = searchParams.get("locale") === "en" ? "en" : "fr";
  if (slugs.length === 0) return NextResponse.json({ error: "empty" }, { status: 400 });
  const items = await getSelectionData(slugs);
  if (items.length === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://formations-ferroviaires.vercel.app";
  const pdf = buildSelectionPdf(items, locale, base, loadPdfFonts());
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="formations-ferroviaires-selection-${date}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
