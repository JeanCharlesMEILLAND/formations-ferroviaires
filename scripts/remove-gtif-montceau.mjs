import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const gtif = await p.establishment.findUnique({ where: { slug: "gtif-montceau-les-mines" } });
if (gtif) {
  // Delete formation links first
  await p.establishmentFormation.deleteMany({ where: { establishmentId: gtif.id } });
  await p.establishment.delete({ where: { id: gtif.id } });
  console.log("Deleted GTIF Montceau-les-Mines");
} else {
  console.log("GTIF Montceau not found");
}

// Also update GTIF Saint-Pierre address from PDF (registered office is Coulommiers)
const gtifSP = await p.establishment.findUnique({ where: { slug: "gtif-saint-pierre-des-corps" } });
if (gtifSP) {
  await p.establishment.update({
    where: { id: gtifSP.id },
    data: { address: "2 Place de la Gare, 37700 Saint-Pierre-des-Corps" }
  });
  console.log("Updated GTIF Saint-Pierre address");
}

await p.$disconnect();
