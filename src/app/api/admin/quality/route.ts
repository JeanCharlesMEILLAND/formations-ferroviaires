import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { normalize } from "@/lib/search";

export const dynamic = "force-dynamic";

/** Contrôles de qualité des données : ce qui mérite une relecture humaine, avec les liens pour agir. */
export async function GET() {
  if (!verifyAuth()) return unauthorizedResponse();
  const [establishments, formations, metiers] = await Promise.all([
    prisma.establishment.findMany({
      select: { id: true, slug: true, name: true, city: true, lat: true, lng: true, website: true, source: true, region: { select: { code: true } }, formations: { select: { formation: { select: { slug: true } } } } },
      orderBy: { name: "asc" },
    }),
    prisma.formation.findMany({ select: { slug: true, nameFr: true, _count: { select: { establishments: true, metiers: true } } } }),
    prisma.metier.findMany({ select: { slug: true, nameFr: true, _count: { select: { formations: true } } } }),
  ]);
  const verified = establishments.filter((e) => e.source !== "api");
  const row = (e: (typeof establishments)[number], detail?: string) => ({ slug: e.slug, name: e.name, city: e.city, detail });

  // Jeux de liens identiques (posés en bloc) : même liste de formations partagée par plusieurs établissements
  const sets = new Map<string, typeof establishments>();
  for (const e of establishments) {
    if (e.formations.length < 15) continue;
    const key = e.formations.map((f) => f.formation.slug).sort().join("|");
    const g = sets.get(key); if (g) g.push(e); else sets.set(key, [e]);
  }
  const identicalSets = Array.from(sets.values()).filter((g) => g.length > 1).map((g) => ({ count: g[0].formations.length, establishments: g.map((e) => row(e)) }));

  const dup = new Map<string, typeof establishments>();
  for (const e of verified) { const k = normalize(`${e.name} ${e.city}`); const g = dup.get(k); if (g) g.push(e); else dup.set(k, [e]); }

  const checks = {
    identicalSets,
    manyFormations: establishments.filter((e) => e.formations.length > 20).map((e) => row(e, `${e.formations.length} formations`)),
    noFormation: verified.filter((e) => e.formations.length === 0).map((e) => row(e)),
    noWebsite: verified.filter((e) => !e.website).map((e) => row(e)),
    badCoords: establishments.filter((e) => !(e.lat > 41 && e.lat < 51.5 && e.lng > -5.5 && e.lng < 10)).map((e) => row(e, `${e.lat}, ${e.lng}`)),
    capsNames: verified.filter((e) => e.name.length > 6 && e.name === e.name.toUpperCase() && /[A-Z]/.test(e.name)).map((e) => row(e)),
    duplicates: Array.from(dup.values()).filter((g) => g.length > 1).map((g) => ({ count: g.length, establishments: g.map((e) => row(e)) })),
    orphanFormations: formations.filter((f) => f._count.establishments === 0).map((f) => ({ slug: f.slug, name: f.nameFr })),
    formationsNoMetier: formations.filter((f) => f._count.metiers === 0).map((f) => ({ slug: f.slug, name: f.nameFr })),
    metiersNoFormation: metiers.filter((m) => m._count.formations === 0).map((m) => ({ slug: m.slug, name: m.nameFr })),
  };
  return NextResponse.json({ totals: { establishments: establishments.length, verified: verified.length, formations: formations.length, metiers: metiers.length }, checks });
}
