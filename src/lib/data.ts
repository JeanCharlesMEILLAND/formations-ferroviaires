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
    where.OR = [
      { name: { contains: filters.search } },
      { city: { contains: filters.search } },
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

export async function getFormationsForFilter() {
  return prisma.formation.findMany({
    select: {
      slug: true,
      nameFr: true,
      nameEn: true,
      level: { select: { nameFr: true, nameEn: true, order: true } },
    },
    orderBy: [{ level: { order: "asc" } }, { nameFr: "asc" }],
  });
}
