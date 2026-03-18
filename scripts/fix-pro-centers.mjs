import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

// These are professional training centers (formation continue)
// They should NOT be linked to academic formations
const proCenterSlugs = [
  "ciffco-coquelles",
  "omnifer-saint-laurent",
  "ikn-formation-biard",
  "gtif-saint-pierre-des-corps",
  "digirail-le-havre",
  "etf-academy-beauchamp",
  "captrain-formation-creutzwald",
  "sferis-formation-autun",
  "campusfer-nimes",
  "campusfer-hazebrouck",
  "ferrotrainjob-paris",
  "formafer-chevigny",
  "egr-buc",
  "ca2p-quincy-sous-senart",
  "lineas-academy-lille",
  "hexafret-campus-saint-ouen",
  "plate-forme-nge-tarascon",
  "db-cargo-france-aubervilliers",
  "alstom-training-saint-ouen",
  "academie-transdev-issy",
  "ratp-formation-paris",
  "sncf-voyageurs-unft-saint-denis",
  "formarail-ballan-mire",
  "fma-formation-agen",
];

// Find "Titre Pro Conducteur de train" - the only formation continue we have
const titrePro = await p.formation.findFirst({
  where: { slug: { contains: "titre-pro-conducteur" } },
});
console.log("Titre Pro:", titrePro ? titrePro.slug + " (" + titrePro.id + ")" : "NOT FOUND");

for (const slug of proCenterSlugs) {
  const est = await p.establishment.findUnique({ where: { slug } });
  if (!est) {
    console.log("SKIP (not found):", slug);
    continue;
  }

  // Count current links
  const currentLinks = await p.establishmentFormation.count({
    where: { establishmentId: est.id },
  });

  // Delete all formation links
  await p.establishmentFormation.deleteMany({
    where: { establishmentId: est.id },
  });

  // Re-add only Titre Pro Conducteur de train
  let linked = 0;
  if (titrePro) {
    try {
      await p.establishmentFormation.create({
        data: { establishmentId: est.id, formationId: titrePro.id },
      });
      linked = 1;
    } catch {}
  }

  console.log(`${est.name}: ${currentLinks} → ${linked} formation(s)`);
}

// Also check CampusFER Grenay (the main one)
const campusferGrenay = await p.establishment.findFirst({
  where: { slug: { contains: "campusfer" }, city: "Grenay" },
});
// Note: CampusFER Grenay is already "manual" with slug from seed, let's check
const campusfer = await p.establishment.findFirst({
  where: { name: { contains: "CampusFER", mode: "insensitive" }, city: "Grenay" },
});
if (campusfer) {
  const cnt = await p.establishmentFormation.count({ where: { establishmentId: campusfer.id } });
  console.log("\nCampusFER Grenay:", campusfer.slug, "has", cnt, "formations");
}

console.log("\nDone.");
await p.$disconnect();
