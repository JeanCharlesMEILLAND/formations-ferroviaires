import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const regions = await p.region.findMany();
const types = await p.establishmentType.findMany();
const regionMap = Object.fromEntries(regions.map(r => [r.code, r.id]));
const typeMap = Object.fromEntries(types.map(t => [t.slug, t.id]));
const formations = await p.formation.findMany({ select: { id: true } });

const existing = await p.establishment.findUnique({ where: { slug: "lineas-academy-lille" } });
if (existing) {
  console.log("Already exists");
  await p.$disconnect();
  process.exit(0);
}

const est = await p.establishment.create({
  data: {
    slug: "lineas-academy-lille",
    name: "Lineas Academy",
    city: "Lille",
    address: "13 rue Berthelot, Domaine Paindavoine, 59000 Lille",
    lat: 50.6292,
    lng: 3.0573,
    regionId: regionMap["HDF"],
    typeId: typeMap["cfa"],
    website: "https://lineasacademy.net/fr/",
    source: "manual",
  },
});

let links = 0;
for (const f of formations) {
  try {
    await p.establishmentFormation.create({
      data: { establishmentId: est.id, formationId: f.id },
    });
    links++;
  } catch {}
}
console.log("CREATED: Lineas Academy (Lille) →", links, "formations");

const total = await p.establishment.count();
const manual = await p.establishment.count({ where: { source: "manual" } });
console.log("Total:", total, "| Manual:", manual);

await p.$disconnect();
