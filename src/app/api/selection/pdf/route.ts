import { NextRequest, NextResponse } from "next/server";
import { getSelectionData } from "@/lib/selection-data";
import { buildSelectionPdf } from "@/lib/selection-pdf";
import { loadPdfFonts } from "@/lib/pdf-fonts";

export const dynamic = "force-dynamic";

/**
 * Liste à emporter.
 *  - GET  /api/selection/pdf?s=slug1,slug2&locale=fr : la sélection (huit fiches au plus), détaillée.
 *  - POST (formulaire ou JSON) avec s, locale, mode=list, title, subtitle : les résultats de la carte (150 au plus), en tableau par région.
 */
async function handle(params: { s?: string; locale?: string; mode?: string; title?: string; subtitle?: string }) {
  const slugs = (params.s || "").split(",").map((x) => x.trim()).filter(Boolean);
  const locale = params.locale === "en" ? "en" : "fr";
  const mode = params.mode === "list" ? "list" : "selection";
  if (slugs.length === 0) return NextResponse.json({ error: "empty" }, { status: 400 });
  const items = await getSelectionData(slugs, mode === "list" ? 150 : 8);
  if (items.length === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://formations-ferroviaires.vercel.app";
  const clean = (v?: string) => (v || "").replace(/\s+/g, " ").trim().slice(0, 160);
  const pdf = buildSelectionPdf(items, locale, base, loadPdfFonts(), { mode, title: clean(params.title), subtitle: clean(params.subtitle) });
  const date = new Date().toISOString().slice(0, 10);
  const name = mode === "list" ? `formations-ferroviaires-liste-${date}.pdf` : `formations-ferroviaires-selection-${date}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "private, no-store" },
  });
}

export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams;
  return handle({ s: q.get("s") || undefined, locale: q.get("locale") || undefined, mode: q.get("mode") || undefined, title: q.get("title") || undefined, subtitle: q.get("subtitle") || undefined });
}

export async function POST(request: NextRequest) {
  const type = request.headers.get("content-type") || "";
  let body: Record<string, string> = {};
  if (type.includes("application/json")) body = await request.json().catch(() => ({}));
  else { const form = await request.formData().catch(() => null); form?.forEach((v, k) => { body[k] = String(v); }); }
  return handle(body);
}
