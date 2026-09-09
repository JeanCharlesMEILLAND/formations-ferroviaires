import { prisma } from "./prisma";

/** Établissements saisis et relus (tout sauf l'import automatique La Bonne Alternance). */
const VERIFIED = { source: { not: "api" } } as const;

export interface RegionNode {
  code: string;
  name: string;
  lat: number;
  lng: number;
  count: number;
}

export interface FamilyCard {
  key: string; // valeur(s) de famille en base, séparées par des virgules
  label: string;
  jobs: string[];
  jobCount: number;
  formationCount: number;
}

export interface CampusCard {
  slug: string;
  name: string;
  city: string;
  region: string;
  type: string;
  typeColor: string;
}

/**
 * Campus dédiés au rail mis en avant sur l'accueil. Liste choisie à la main : le nombre de liens
 * formation en base ne permet pas de classer (plusieurs campus portent le même jeu de 43 liens, posé en bloc en mars 2026).
 */
const FEATURED_CAMPUSES = ["cmq-fiaem-valenciennes", "ferrocampus-saintes", "efmo-perols", "campus-mecateam-montceau-les-mines", "campus-fer-grenay", "campus-sncf-nanterre"];

export interface HomeData {
  verified: number;
  formations: number;
  metiers: number;
  regions: RegionNode[];
  families: FamilyCard[];
  campuses: CampusCard[];
  updatedAt: Date | null;
}

/** Petites familles regroupées pour l'affichage. */
const FAMILY_GROUPS: Record<string, string> = { Commercial: "Commercial et production", Production: "Commercial et production" };

export async function getHomeData(): Promise<HomeData> {
  const [verified, formations, metierRows, regions, establishments] = await Promise.all([
    prisma.establishment.count({ where: VERIFIED }),
    prisma.formation.count(),
    prisma.metier.findMany({
      select: { nameFr: true, family: true, formations: { select: { formationId: true } } },
      orderBy: { nameFr: "asc" },
    }),
    prisma.region.findMany({
      select: { code: true, name: true, lat: true, lng: true, _count: { select: { establishments: { where: VERIFIED } } } },
    }),
    prisma.establishment.findMany({
      where: { slug: { in: FEATURED_CAMPUSES } },
      select: { slug: true, name: true, city: true, region: { select: { name: true } }, type: { select: { nameFr: true, color: true } } },
    }),
  ]);

  const families = new Map<string, { label: string; keys: Set<string>; jobs: string[]; formationIds: Set<string> }>();
  for (const m of metierRows) {
    const label = FAMILY_GROUPS[m.family] ?? m.family;
    const f = families.get(label) ?? { label, keys: new Set<string>(), jobs: [], formationIds: new Set<string>() };
    f.keys.add(m.family);
    f.jobs.push(m.nameFr);
    for (const l of m.formations) f.formationIds.add(l.formationId);
    families.set(label, f);
  }

  const campuses: CampusCard[] = FEATURED_CAMPUSES
    .map((slug) => establishments.find((e) => e.slug === slug))
    .filter((e): e is NonNullable<typeof e> => Boolean(e))
    .map((e) => ({ slug: e.slug, name: e.name, city: e.city, region: e.region.name, type: e.type.nameFr, typeColor: e.type.color }));

  return {
    verified,
    formations,
    metiers: metierRows.length,
    regions: regions
      .map((r) => ({ code: r.code, name: r.name, lat: r.lat, lng: r.lng, count: r._count.establishments }))
      .filter((r) => r.count > 0),
    families: Array.from(families.values())
      .map((f) => ({ key: Array.from(f.keys).join(","), label: f.label, jobs: f.jobs, jobCount: f.jobs.length, formationCount: f.formationIds.size }))
      .sort((a, b) => b.jobCount - a.jobCount),
    campuses,
    updatedAt: null, // le modèle n'horodate pas encore les fiches
  };
}
