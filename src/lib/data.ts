import { prisma } from "./prisma";

export async function getEstablishments(filters?: {
  type?: string;
  region?: string;
  domain?: string;
  level?: string;
  search?: string;
  metier?: string;
  formation?: string;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.type) {
    where.type = { slug: filters.type };
  }
  if (filters?.region) {
    where.region = { code: filters.region };
  }
  if (filters?.search) {
    const q = filters.search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { slug: { contains: q.toLowerCase().replace(/\s+/g, "-") } },
      { formations: { some: { formation: { nameFr: { contains: q, mode: "insensitive" } } } } },
    ];
  }

  // Build formation filter conditions
  const formationConditions: Record<string, unknown> = {};
  if (filters?.domain) formationConditions.domain = { slug: filters.domain };
  if (filters?.level) formationConditions.level = { slug: filters.level };
  if (filters?.formation) formationConditions.slug = filters.formation;
  if (filters?.metier) {
    formationConditions.metiers = {
      some: { metier: { slug: filters.metier } },
    };
  }

  if (Object.keys(formationConditions).length > 0) {
    where.formations = {
      some: { formation: formationConditions },
    };
  }

  return prisma.establishment.findMany({
    where,
    include: {
      type: true,
      region: true,
      formations: {
        include: {
          formation: {
            include: {
              level: true,
              domain: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getEstablishmentBySlug(slug: string) {
  return prisma.establishment.findUnique({
    where: { slug },
    include: {
      type: true,
      region: true,
      formations: {
        include: {
          formation: {
            include: {
              level: true,
              domain: true,
              metiers: {
                include: {
                  metier: { select: { slug: true, nameFr: true, family: true, source: true } },
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function getFormations() {
  return prisma.formation.findMany({
    include: {
      level: true,
      domain: true,
      establishments: {
        include: {
          establishment: {
            include: {
              type: true,
              region: true,
            },
          },
        },
      },
    },
    orderBy: [{ level: { order: "asc" } }, { nameFr: "asc" }],
  });
}

export async function getFormationBySlug(slug: string) {
  return prisma.formation.findUnique({
    where: { slug },
    include: {
      level: true,
      domain: true,
      establishments: {
        include: {
          establishment: {
            include: {
              type: true,
              region: true,
            },
          },
        },
      },
    },
  });
}

export async function getRegions() {
  return prisma.region.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getEstablishmentTypes() {
  return prisma.establishmentType.findMany({
    orderBy: { nameFr: "asc" },
  });
}

export async function getFormationLevels() {
  return prisma.formationLevel.findMany({
    orderBy: { order: "asc" },
  });
}

export async function getFormationDomains() {
  return prisma.formationDomain.findMany({
    orderBy: { nameFr: "asc" },
  });
}

export async function getMetiers() {
  return prisma.metier.findMany({
    orderBy: [{ family: "asc" }, { nameFr: "asc" }],
  });
}

/** Formations complètes (niveau, domaine) : la carte s'en sert pour reconstituer les fiches à partir des slugs. */
export async function getFormationsForFilter() {
  return prisma.formation.findMany({
    select: {
      id: true, slug: true, nameFr: true, nameEn: true, rncpCode: true, onisepUrl: true, jobTarget: true,
      level: { select: { id: true, slug: true, nameFr: true, nameEn: true, order: true } },
      domain: { select: { id: true, slug: true, nameFr: true, nameEn: true, color: true } },
    },
    orderBy: [{ level: { order: "asc" } }, { nameFr: "asc" }],
  });
}

/** Tous les établissements, forme compacte : le navigateur filtre et cherche lui-même (1 800 lignes, ~300 Ko). */
export async function getEstablishmentsSlim() {
  const rows = await prisma.establishment.findMany({
    select: {
      id: true, slug: true, name: true, city: true, lat: true, lng: true, website: true, onisepUrl: true, source: true,
      type: { select: { slug: true } }, region: { select: { code: true } },
      formations: { select: { formation: { select: { slug: true } } } },
    },
    orderBy: { name: "asc" },
  });
  return rows.map((e) => ({
    id: e.id, slug: e.slug, name: e.name, city: e.city, lat: e.lat, lng: e.lng, website: e.website, onisepUrl: e.onisepUrl,
    source: e.source, type: e.type.slug, region: e.region.code, formations: e.formations.map((f) => f.formation.slug),
  }));
}

/** Index de suggestions : établissements vérifiés, formations, métiers et villes, avec leur poids. */
export async function getSearchIndex() {
  const [establishments, formations, metiers] = await Promise.all([
    prisma.establishment.findMany({
      where: { source: { not: "api" } },
      select: { slug: true, name: true, city: true, lat: true, lng: true, _count: { select: { formations: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.formation.findMany({ select: { slug: true, nameFr: true, level: { select: { nameFr: true } }, _count: { select: { establishments: true } } } }),
    prisma.metier.findMany({ select: { slug: true, nameFr: true, family: true, _count: { select: { formations: true } } } }),
  ]);
  const cities = new Map<string, number>();
  for (const e of establishments) cities.set(e.city, (cities.get(e.city) ?? 0) + 1);
  return {
    establishments: establishments.map((e) => ({ slug: e.slug, name: e.name, city: e.city, lat: e.lat, lng: e.lng, count: e._count.formations })),
    formations: formations.map((f) => ({ slug: f.slug, nameFr: f.nameFr, level: f.level.nameFr, count: f._count.establishments })),
    metiers: metiers.map((m) => ({ slug: m.slug, nameFr: m.nameFr, family: m.family, count: m._count.formations })),
    cities: Array.from(cities.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
  };
}

export async function getMetierFormationLinks() {
  return prisma.metierFormation.findMany({
    select: {
      metier: { select: { slug: true, nameFr: true, family: true } },
      formation: { select: { slug: true } },
    },
  });
}

/** Page formation : niveau, domaine, métiers visés, établissements (vérifiés et généralistes). */
export async function getFormationPage(slug: string) {
  return prisma.formation.findUnique({
    where: { slug },
    include: {
      level: true,
      domain: true,
      metiers: { include: { metier: { select: { slug: true, nameFr: true, family: true, level: true } } } },
      establishments: {
        include: { establishment: { select: { slug: true, name: true, city: true, source: true, website: true, type: { select: { slug: true, nameFr: true, nameEn: true, color: true } }, region: { select: { code: true, name: true } } } } },
      },
    },
  });
}

/** Page métier : formations qui y mènent (avec leurs établissements vérifiés) et métiers de la même famille. */
export async function getMetierPage(slug: string) {
  const metier = await prisma.metier.findUnique({
    where: { slug },
    include: {
      formations: {
        include: {
          formation: {
            include: {
              level: true,
              domain: true,
              establishments: {
                where: { establishment: { source: { not: "api" } } },
                include: { establishment: { select: { slug: true, name: true, city: true, type: { select: { slug: true, nameFr: true, nameEn: true, color: true } }, region: { select: { code: true, name: true } } } } },
              },
            },
          },
        },
      },
    },
  });
  if (!metier) return null;
  const related = await prisma.metier.findMany({ where: { family: metier.family, slug: { not: slug } }, select: { slug: true, nameFr: true }, orderBy: { nameFr: "asc" } });
  return { ...metier, related };
}

/** Slugs des pages formation et métier, pour le plan du site. */
export async function getPublicSlugs() {
  const [formations, metiers] = await Promise.all([
    prisma.formation.findMany({ select: { slug: true } }),
    prisma.metier.findMany({ select: { slug: true } }),
  ]);
  return { formations: formations.map((f) => f.slug), metiers: metiers.map((m) => m.slug) };
}
