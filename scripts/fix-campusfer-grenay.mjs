import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const campusfer = await p.establishment.findFirst({
  where: { name: { contains: "CampusFER", mode: "insensitive" }, city: "Grenay" },
});
const titrePro = await p.formation.findFirst({
  where: { slug: { contains: "titre-pro-conducteur" } },
});

if (campusfer && titrePro) {
  try {
    await p.establishmentFormation.create({
      data: { establishmentId: campusfer.id, formationId: titrePro.id },
    });
    console.log("Linked CampusFER Grenay to Titre Pro");
  } catch { console.log("Already linked"); }
}

await p.$disconnect();
