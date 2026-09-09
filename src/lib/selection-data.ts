import { prisma } from "./prisma";

/** Fiches complètes des établissements d'une sélection (huit au plus), dans l'ordre demandé. */
export async function getSelectionData(slugs: string[], max = 8) {
  const wanted = Array.from(new Set(slugs.filter((s) => /^[a-z0-9-]{1,120}$/.test(s)))).slice(0, max);
  if (wanted.length === 0) return [];
  const rows = await prisma.establishment.findMany({
    where: { slug: { in: wanted } },
    include: {
      type: true,
      region: true,
      formations: { include: { formation: { include: { level: true, domain: true, metiers: { include: { metier: { select: { slug: true, nameFr: true, family: true } } } } } } } },
    },
  });
  return wanted.map((s) => rows.find((r) => r.slug === s)).filter((r): r is NonNullable<typeof r> => Boolean(r));
}
export type SelectionItem = Awaited<ReturnType<typeof getSelectionData>>[number];
