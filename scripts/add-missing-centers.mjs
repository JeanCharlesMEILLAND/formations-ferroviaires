import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const regions = await prisma.region.findMany();
const types = await prisma.establishmentType.findMany();
const regionMap = Object.fromEntries(regions.map(r => [r.code, r.id]));
const typeMap = Object.fromEntries(types.map(t => [t.slug, t.id]));
const formations = await prisma.formation.findMany({ select: { id: true } });

const centers = [
  {
    slug: "digirail-le-havre",
    name: "DigiRail - Formation et Expertise Ferroviaire",
    city: "Le Havre",
    region: "NOR",
    type: "cfa",
    lat: 49.4944,
    lng: 0.1079,
    website: "https://www.digirail.fr",
    address: "120 Boulevard Amiral Mouchez, 76600 Le Havre",
  },
  {
    slug: "gtif-saint-pierre-des-corps",
    name: "GTIF - Gestion des Techniques d'Ingénierie et de Formation",
    city: "Saint-Pierre-des-Corps",
    region: "CVL",
    type: "cfa",
    lat: 47.3861,
    lng: 0.7236,
    website: "https://gtif.fr/",
    address: "2 Place de la Gare, 37700 Saint-Pierre-des-Corps",
  },
  {
    slug: "gtif-montceau-les-mines",
    name: "GTIF Montceau-les-Mines",
    city: "Montceau-les-Mines",
    region: "BFC",
    type: "cfa",
    lat: 46.6700,
    lng: 4.3630,
    website: "https://gtif.fr/",
    address: "6 rue de Gueugnon, 71300 Montceau-les-Mines",
  },
  {
    slug: "ikn-formation-biard",
    name: "IKN Formation",
    city: "Biard",
    region: "NAQ",
    type: "cfa",
    lat: 46.5864,
    lng: 0.3132,
    website: "https://www.ikn-ferro.com/",
    address: "20 rue Annet Segeron, 86580 Biard",
  },
];

for (const c of centers) {
  const existing = await prisma.establishment.findUnique({ where: { slug: c.slug } });
  if (existing) {
    console.log("SKIP:", c.name);
    continue;
  }

  const est = await prisma.establishment.create({
    data: {
      slug: c.slug,
      name: c.name,
      city: c.city,
      address: c.address,
      lat: c.lat,
      lng: c.lng,
      regionId: regionMap[c.region],
      typeId: typeMap[c.type],
      website: c.website,
      source: "manual",
    },
  });

  let links = 0;
  for (const f of formations) {
    try {
      await prisma.establishmentFormation.create({
        data: { establishmentId: est.id, formationId: f.id },
      });
      links++;
    } catch {}
  }
  console.log("CREATED:", c.name, "(" + c.city + ") →", links, "formations");
}

const total = await prisma.establishment.count();
const manual = await prisma.establishment.count({ where: { source: "manual" } });
console.log("\nTotal:", total, "| Manual:", manual);

await prisma.$disconnect();
