import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const regions = await prisma.region.findMany();
const types = await prisma.establishmentType.findMany();
const regionMap = Object.fromEntries(regions.map(r => [r.code, r.id]));
const typeMap = Object.fromEntries(types.map(t => [t.slug, t.id]));
const formations = await prisma.formation.findMany({ select: { id: true } });

// All missing EPSF-accredited training orgs from PDF 18/12/2025
const centers = [
  {
    slug: "academie-transdev-issy",
    name: "Académie by Transdev",
    city: "Issy-les-Moulineaux",
    region: "IDF",
    type: "cfa",
    lat: 48.8235,
    lng: 2.2615,
    address: "3 allée de Grenelle, Immeuble Crystal, 92442 Issy-les-Moulineaux",
  },
  {
    slug: "alstom-training-saint-ouen",
    name: "Alstom Training & Simulation",
    city: "Saint-Ouen-sur-Seine",
    region: "IDF",
    type: "cfa",
    lat: 48.9118,
    lng: 2.3340,
    address: "48 rue Albert Dhalenne, 93400 Saint-Ouen-sur-Seine",
    website: "https://www.alstom.com/",
  },
  {
    slug: "ca2p-quincy-sous-senart",
    name: "CA2P",
    city: "Quincy-sous-Sénart",
    region: "IDF",
    type: "cfa",
    lat: 48.6712,
    lng: 2.5283,
    address: "6 rue des Deux Communes, 91480 Quincy-sous-Sénart",
  },
  {
    slug: "db-cargo-france-aubervilliers",
    name: "DB Cargo France",
    city: "Aubervilliers",
    region: "IDF",
    type: "cfa",
    lat: 48.9176,
    lng: 2.3833,
    address: "45 avenue Victor Hugo, Bâtiment 268, 93300 Aubervilliers",
    website: "https://fr.dbcargo.com/",
  },
  {
    slug: "egr-buc",
    name: "École de Gestion des Risques (EGR)",
    city: "Buc",
    region: "IDF",
    type: "cfa",
    lat: 48.7730,
    lng: 2.1230,
    address: "41 rue de Fourny, 78530 Buc",
    website: "https://www.ecoledegestiondesrisques.fr/",
  },
  {
    slug: "ferrotrainjob-paris",
    name: "FerroTrainJob",
    city: "Paris 8e",
    region: "IDF",
    type: "cfa",
    lat: 48.8740,
    lng: 2.3170,
    address: "75 boulevard Haussmann, 75008 Paris",
    website: "https://www.ferrotrainjob.fr/",
  },
  {
    slug: "formafer-chevigny",
    name: "FORM@FER",
    city: "Chevigny-Saint-Sauveur",
    region: "BFC",
    type: "cfa",
    lat: 47.3000,
    lng: 5.1360,
    address: "15 boulevard Jean Moulin, 21800 Chevigny-Saint-Sauveur",
  },
  {
    slug: "hexafret-campus-saint-ouen",
    name: "Hexafret - Campus Hexafret",
    city: "Saint-Ouen-sur-Seine",
    region: "IDF",
    type: "cfa",
    lat: 48.9083,
    lng: 2.3320,
    address: "16 rue Simone Veil, 93400 Saint-Ouen-sur-Seine",
    website: "https://www.hexafret.com/",
  },
  {
    slug: "plate-forme-nge-tarascon",
    name: "PLATE FORME (Groupe NGE)",
    city: "Tarascon",
    region: "PAC",
    type: "cfa",
    lat: 43.7980,
    lng: 4.6530,
    address: "Parc d'activités de Laurade, BP 22, 13103 Tarascon",
    website: "https://plateforme.nge.fr/",
  },
  {
    slug: "ratp-formation-paris",
    name: "RATP - Formation Conduite",
    city: "Paris 20e",
    region: "IDF",
    type: "cfa",
    lat: 48.8530,
    lng: 2.4050,
    address: "92 rue de Lagny, 75020 Paris",
    website: "https://www.ratp.fr/",
  },
  {
    slug: "sncf-voyageurs-unft-saint-denis",
    name: "SNCF Voyageurs UNFT - Campus Campra",
    city: "La Plaine Saint-Denis",
    region: "IDF",
    type: "cfa",
    lat: 48.9170,
    lng: 2.3580,
    address: "4 rue André Campra, 93210 La Plaine Saint-Denis",
    website: "https://www.sncf.com/",
  },
];

let created = 0;
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
      address: c.address || null,
      lat: c.lat,
      lng: c.lng,
      regionId: regionMap[c.region],
      typeId: typeMap[c.type],
      website: c.website || null,
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
  created++;
}

console.log("\nCreated:", created);
const total = await prisma.establishment.count();
const manual = await prisma.establishment.count({ where: { source: "manual" } });
console.log("Total:", total, "| Manual:", manual, "| API:", total - manual);

await prisma.$disconnect();
