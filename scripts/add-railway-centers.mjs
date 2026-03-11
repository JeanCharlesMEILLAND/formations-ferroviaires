import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Get required references
const regions = await prisma.region.findMany();
const types = await prisma.establishmentType.findMany();
const regionMap = Object.fromEntries(regions.map(r => [r.code, r.id]));
const typeMap = Object.fromEntries(types.map(t => [t.slug, t.id]));

const formations = await prisma.formation.findMany({ select: { id: true, slug: true, nameFr: true } });
const formationMap = Object.fromEntries(formations.map(f => [f.slug, f.id]));

// Railway-specific training centers to add
const railwayCenters = [
  {
    slug: "ciffco-coquelles",
    name: "CIFFCO - Centre International de Formation Ferroviaire",
    city: "Coquelles",
    region: "HDF",
    type: "cfa",
    lat: 50.928,
    lng: 1.806,
    website: "https://ciffco.com/",
    address: "Terminal Eurotunnel, 62231 Coquelles",
  },
  {
    slug: "etf-academy-beauchamp",
    name: "ETF Academy (VINCI)",
    city: "Beauchamp",
    region: "IDF",
    type: "cfa",
    lat: 49.012,
    lng: 2.190,
    website: "https://www.etf.fr/",
    address: "Beauchamp, 95250",
  },
  {
    slug: "sferis-formation-autun",
    name: "SFERIS Formation",
    city: "Autun",
    region: "BFC",
    type: "cfa",
    lat: 46.951,
    lng: 4.299,
    website: "https://www.sferis.fr/formation/",
  },
  {
    slug: "captrain-formation-creutzwald",
    name: "Captrain Formation",
    city: "Creutzwald",
    region: "GES",
    type: "cfa",
    lat: 49.069,
    lng: 6.694,
    website: "https://www.captrain.fr/",
  },
  {
    slug: "lea-itedec-aubergenville",
    name: "L'EA-ITEDEC - Plateforme ferroviaire",
    city: "Aubergenville",
    region: "IDF",
    type: "cfa",
    lat: 48.960,
    lng: 1.854,
    website: "https://www.ecole-lea.fr/",
  },
  {
    slug: "omnifer-saint-laurent",
    name: "OMNIFER - Formations Ferroviaires",
    city: "Saint-Laurent-sur-Sèvre",
    region: "PDL",
    type: "cfa",
    lat: 46.959,
    lng: -0.893,
    website: "https://www.omnifer.fr/",
  },
  {
    slug: "formarail-ballan-mire",
    name: "Forma'Rail",
    city: "Ballan-Miré",
    region: "CVL",
    type: "cfa",
    lat: 47.347,
    lng: 0.614,
    website: "https://forma-rail.com/",
    address: "4 Boulevard de Chinon, 37510 Ballan-Miré",
  },
  {
    slug: "fma-formation-agen",
    name: "FMA Formation - Centre de Formation Ferroviaire",
    city: "Agen",
    region: "NAQ",
    type: "cfa",
    lat: 44.203,
    lng: 0.617,
    website: "https://formationferroviaire.fr/",
    address: "26 Avenue Jean Jaurès, 47000 Agen",
  },
  {
    slug: "cmq-fiaem-valenciennes",
    name: "CMQ FIAEM - Campus des Métiers Ferroviaire et Écomobilité",
    city: "Valenciennes",
    region: "HDF",
    type: "cfa",
    lat: 50.358,
    lng: 3.523,
    website: "https://campus.hautsdefrance.fr/fiaem/",
  },
  {
    slug: "efmo-perols",
    name: "EFMO - École du Ferroviaire et des Mobilités d'Occitanie",
    city: "Pérols",
    region: "OCC",
    type: "cfa",
    lat: 43.529,
    lng: 3.956,
  },
  {
    slug: "railenium-valenciennes",
    name: "Railenium - Institut de Recherche Technologique Ferroviaire",
    city: "Valenciennes",
    region: "HDF",
    type: "ecole-ingenieur",
    lat: 50.313,
    lng: 3.514,
    website: "https://railenium.eu/",
    address: "180 rue Joseph Louis Lagrange, 59308 Valenciennes",
  },
  {
    slug: "campusfer-nimes",
    name: "CampusFER Nîmes",
    city: "Nîmes",
    region: "OCC",
    type: "cfa",
    lat: 43.837,
    lng: 4.360,
    website: "https://www.campusfer.com/",
  },
  {
    slug: "campusfer-hazebrouck",
    name: "CampusFER Hazebrouck",
    city: "Hazebrouck",
    region: "HDF",
    type: "cfa",
    lat: 50.725,
    lng: 2.539,
    website: "https://www.campusfer.com/",
  },
];

let created = 0;
let skipped = 0;

for (const center of railwayCenters) {
  // Check if already exists
  const existing = await prisma.establishment.findUnique({ where: { slug: center.slug } });
  if (existing) {
    console.log(`SKIP (exists): ${center.name}`);
    skipped++;
    continue;
  }

  const regionId = regionMap[center.region];
  const typeId = typeMap[center.type];
  if (!regionId || !typeId) {
    console.log(`SKIP (missing ref): ${center.name} - region=${center.region} type=${center.type}`);
    skipped++;
    continue;
  }

  const est = await prisma.establishment.create({
    data: {
      slug: center.slug,
      name: center.name,
      city: center.city,
      address: center.address || null,
      lat: center.lat,
      lng: center.lng,
      regionId,
      typeId,
      website: center.website || null,
      source: "manual",
    },
  });

  // Link to ALL formations (railway-specific centers offer all)
  let links = 0;
  for (const f of formations) {
    try {
      await prisma.establishmentFormation.create({
        data: { establishmentId: est.id, formationId: f.id },
      });
      links++;
    } catch {
      // Already exists
    }
  }

  console.log(`CREATED: ${center.name} (${center.city}) → ${links} formations`);
  created++;
}

// Also upgrade Campus Mecateam from "api" to "manual"
const mecateam = await prisma.establishment.findFirst({
  where: { name: { contains: "MECATEAM", mode: "insensitive" } },
});
if (mecateam && mecateam.source === "api") {
  await prisma.establishment.update({
    where: { id: mecateam.id },
    data: { source: "manual", website: "https://www.mecateamcluster.org/" },
  });
  // Link all formations
  let mecaLinks = 0;
  for (const f of formations) {
    try {
      await prisma.establishmentFormation.create({
        data: { establishmentId: mecateam.id, formationId: f.id },
      });
      mecaLinks++;
    } catch {}
  }
  console.log(`UPGRADED: ${mecateam.name} → manual + ${mecaLinks} formations`);
}

// Upgrade Purple Campus Béziers if it's ferroviaire
const purple = await prisma.establishment.findFirst({
  where: { name: { contains: "PURPLE CAMPUS", mode: "insensitive" }, city: { contains: "Béziers", mode: "insensitive" } },
});
if (purple && purple.source === "api") {
  await prisma.establishment.update({
    where: { id: purple.id },
    data: { source: "manual", website: "https://www.purple-campus.com/" },
  });
  console.log(`UPGRADED: ${purple.name} (${purple.city}) → manual`);
}

console.log(`\nDone: ${created} created, ${skipped} skipped`);

// Final stats
const total = await prisma.establishment.count();
const manual = await prisma.establishment.count({ where: { source: "manual" } });
console.log(`Total: ${total} | Manual: ${manual} | API: ${total - manual}`);

await prisma.$disconnect();
