import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

// Get required IDs
const regionNAQ = await p.region.findUnique({ where: { code: "NAQ" } });
const typeCFA = await p.establishmentType.findUnique({ where: { slug: "cfa" } });

if (!regionNAQ || !typeCFA) {
  console.log("Missing region NAQ or type CFA");
  process.exit(1);
}

// Check if already exists
const existing = await p.establishment.findUnique({ where: { slug: "ferrocampus-saintes" } });
if (existing) {
  console.log("Ferrocampus already exists:", existing.id);
  await p.$disconnect();
  process.exit(0);
}

// Create Ferrocampus
const ferrocampus = await p.establishment.create({
  data: {
    slug: "ferrocampus-saintes",
    name: "Ferrocampus - Campus des métiers du ferroviaire",
    city: "Saintes",
    address: "1 Rue Denis Papin, 17100 Saintes",
    lat: 45.7461,
    lng: -0.6320,
    regionId: regionNAQ.id,
    typeId: typeCFA.id,
    website: "https://www.ferrocampus.fr",
    source: "manual",
  },
});
console.log("Created Ferrocampus:", ferrocampus.id, ferrocampus.slug);

// Link to ALL formations (it's the national campus for all railway training)
const formations = await p.formation.findMany({ select: { id: true, nameFr: true } });
let linked = 0;
for (const f of formations) {
  try {
    await p.establishmentFormation.create({
      data: {
        establishmentId: ferrocampus.id,
        formationId: f.id,
      },
    });
    linked++;
    console.log("  Linked:", f.nameFr);
  } catch {
    // Already exists
  }
}
console.log("\nTotal formations linked:", linked);

await p.$disconnect();
