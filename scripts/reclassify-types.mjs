import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Same logic as in enrich/route.ts — keep in sync
function guessEstablishmentType(companyName) {
  const name = companyName.toLowerCase();
  const upper = companyName.toUpperCase();

  if (name.includes("iut")) return "iut";

  if (
    name.includes("ingénieur") || name.includes("ingenieur") ||
    name.includes("insa ") || upper.startsWith("INSA") ||
    name.includes("estaca") || name.includes("imt ") ||
    name.includes("polytech") || name.includes("cesi") ||
    name.includes("ensait") || name.includes("ensiate") ||
    name.includes("isen ") || upper.startsWith("ISEN") ||
    name.includes("esisar") || name.includes("esima") || name.includes("esiia") ||
    name.includes("bretagne inp") || upper === "INPT" ||
    name.includes("sigma clermont") ||
    name.includes("ismans") || name.includes("yncrea") ||
    name.includes("cpe lyon") || upper === "ECL" ||
    name.includes("estp") || name.includes("icam") ||
    name.includes("telecom") ||
    name.includes("ecole nationale superieure des mines") ||
    name.includes("ecole nat sup") ||
    name.includes("institut polytechnique") ||
    name.includes("institut national des sciences appliquees") ||
    name.includes("fondation e.p.f") || name.includes("epf ") ||
    name.includes("itech") || name.includes("ispa") ||
    name.includes("institut mines") || name.includes("ensp")
  ) return "ecole-ingenieur";

  if (
    name.includes("grande école") || name.includes("grande ecole") ||
    name.includes("centrale") || name.includes("ponts") ||
    name.includes("audencia") || name.includes("kedge") ||
    name.includes("neoma") || name.includes("toulouse business school") ||
    name.includes("business school") || name.includes("ecole de management") ||
    name.includes("em normandie") || name.includes("esc ") || upper.startsWith("ESC ") ||
    name.includes("grenoble ecole de management") ||
    name.includes("ecole de commerce") ||
    name.includes("sciences po") || name.includes("creapole") ||
    name.includes("ecole de design") || name.includes("strate")
  ) return "grande-ecole";

  if (
    name.includes("université") || name.includes("universite") ||
    name.includes("univ ") || upper.startsWith("UNIV") ||
    name.includes("ufr ") || upper.startsWith("UFR") ||
    name.includes("faculte") || name.includes("faculté") ||
    name.includes("cnam") ||
    name.includes("iae ") || upper.startsWith("IAE") ||
    upper === "UCA" || upper === "UBS" || upper === "UPHF" ||
    upper === "UPPA" || upper === "URCA" || upper === "UTT" ||
    name.includes("uco ") || upper.startsWith("UCO") ||
    name.includes("ucobn") ||
    name.includes("departement des ") ||
    name.includes("epscp") ||
    name.includes("antenne inspe") || name.includes("antenne ufr") ||
    name.includes("oniris") || name.includes("institut agro") ||
    name.includes("ecole de droit")
  ) return "universite";

  if (
    name.includes("cfa") || name.includes("apprenti") ||
    name.includes("afpa") || name.includes("greta") || name.includes("cfai") ||
    name.includes("aftral") || name.includes("isteli") ||
    name.includes("promotrans") || name.includes("aft ") || name.includes("aft-fc") ||
    name.includes("almea") ||
    name.includes("cma ") || upper.startsWith("CMA") || name.includes("cmar ") ||
    name.includes("cci ") || upper.startsWith("CCI") || name.includes("ccit") || name.includes("ccinca") ||
    name.includes("afpi") || name.includes("afpia") || name.includes("afpma") ||
    name.includes("afobtp") || name.includes("aforpa") || name.includes("aforia") ||
    name.includes("afme ") || name.includes("aforp") ||
    name.includes("aocdtf") || name.includes("compagnon") ||
    name.includes("mfr ") || name.includes("maison familiale") ||
    name.includes("campus des metiers") || name.includes("campus des métiers") ||
    name.includes("purple campus") ||
    name.includes("formasup") || name.includes("cerfal") ||
    name.includes("ifria") || name.includes("efiip") ||
    name.includes("centre de formation") || name.includes("centre formation") ||
    name.includes("centre form") ||
    name.includes("cap formation") || name.includes("pole formation") ||
    name.includes("la cite des formations") ||
    name.includes("inhni") || name.includes("garac") ||
    name.includes("3ifa") || name.includes("interfora") ||
    name.includes("bassin formation") ||
    name.includes("batys") || name.includes("forma ") ||
    name.includes("cecof") || name.includes("cfppa") ||
    name.includes("afi24") || name.includes("afip") ||
    name.includes("alternance") && !name.includes("bachelor") ||
    name.includes("laho") ||
    name.includes("fodeno") || name.includes("fodipeg") ||
    name.includes("feder compagnonique") ||
    name.includes("trajectoire formation") ||
    name.includes("formation profess") ||
    name.includes("gip ") || upper.startsWith("GIP") ||
    name.includes("campus mecateam") || name.includes("campus orion") ||
    name.includes("campus dalkia") ||
    name.includes("eco-campus") ||
    name.includes("adrar formation") ||
    name.includes("prometa") ||
    name.includes("agesup") || name.includes("agefpi") || name.includes("agefis") ||
    name.includes("assifep") ||
    name.includes("competences et metiers") ||
    name.includes("ufa ") || upper.startsWith("UFA") ||
    name.includes("inst format") || name.includes("inst.develop")
  ) return "cfa";

  if (
    name.includes("lycée") || name.includes("lycee") ||
    name.includes("lyc ") || upper.startsWith("LYC") ||
    /\bLPO\b/.test(upper) || /\bLP\b/.test(upper) || /\bLPOR\b/.test(upper) || /\bLPAP\b/.test(upper) ||
    /\bLGT\b/.test(upper) || /\bLP0\b/.test(upper) || /\bLPP\b/.test(upper) ||
    /\bLT\b/.test(upper) || /\bLYP\b/.test(upper) ||
    /\bLEGTA\b/.test(upper) || /\bLEGTPA\b/.test(upper) || /\bLEGP\b/.test(upper) || /\bLEP\b/.test(upper) ||
    name.includes("ogec") || name.includes("o.g.e.c") || name.includes("o g e c") ||
    name.includes("organ ges") || name.includes("organisme de gestion") ||
    name.includes("institution ") || name.includes("institution saint") ||
    name.includes("dom sortais") ||
    name.includes("ass andre coindre") || name.includes("ass de gestion") ||
    name.includes("ass ecole technique") || name.includes("ass gestion ecole") ||
    name.includes("ass familiale") || name.includes("ass ogec") ||
    name.includes("ass responsable") || name.includes("ass.ogec") ||
    name.includes("assoc enseign") || name.includes("assoc institut prof") ||
    name.includes("association educative") || name.includes("association la providence") ||
    name.includes("association saint joseph") || name.includes("association saliege") ||
    name.includes("association scolaire") || name.includes("association des etablissements scolaires") ||
    name.includes("fondation don bosco") || name.includes("fondation la mache") ||
    name.includes("groupe de la salle") || name.includes("institution de la salle") ||
    name.includes("groupe scolaire") ||
    name.includes("collegium") ||
    name.includes("aep ") || name.includes("beau frene") ||
    name.includes("gestion centre formation appretis enseignement catholique") ||
    name.includes("gestion ctre forma appr") ||
    name.includes("eplefpa") || name.includes("eplag") ||
    name.includes("institut cadenelle") || name.includes("institut de genech") ||
    name.includes("institut jean errecart") || name.includes("institut nicolas barre") ||
    name.includes("soc enseignement") || name.includes("service enseignement") ||
    name.includes("les formations du marais")
  ) return "lycee";

  return "autre";
}

// Get type IDs
const types = await prisma.establishmentType.findMany();
const typeMap = Object.fromEntries(types.map(t => [t.slug, t.id]));
console.log("Types:", Object.keys(typeMap).join(", "));

// Get all "autre" establishments
const autreTypeId = typeMap["autre"];
const autres = await prisma.establishment.findMany({
  where: { typeId: autreTypeId },
  select: { id: true, name: true },
});

console.log(`\nAnalyzing ${autres.length} "autre" establishments...\n`);

const reclassified = { lycee: 0, cfa: 0, universite: 0, "ecole-ingenieur": 0, "grande-ecole": 0, iut: 0, autre: 0 };
const updates = [];

for (const est of autres) {
  const newType = guessEstablishmentType(est.name);
  reclassified[newType]++;
  if (newType !== "autre") {
    updates.push({ id: est.id, name: est.name, newType });
  }
}

console.log("Reclassification results:");
for (const [type, count] of Object.entries(reclassified)) {
  console.log(`  ${type}: ${count}`);
}
console.log(`\nTotal to update: ${updates.length}`);
console.log(`Remaining "autre": ${reclassified.autre}`);

// Apply updates
let updated = 0;
for (const u of updates) {
  const newTypeId = typeMap[u.newType];
  if (!newTypeId) {
    console.log(`  SKIP: no type ID for "${u.newType}"`);
    continue;
  }
  await prisma.establishment.update({
    where: { id: u.id },
    data: { typeId: newTypeId },
  });
  updated++;
}

console.log(`\nUpdated ${updated} establishments.`);

// Final stats
const stats = await prisma.establishment.groupBy({
  by: ["typeId"],
  _count: true,
});
console.log("\nFinal distribution:");
for (const s of stats) {
  const type = types.find(t => t.id === s.typeId);
  console.log(`  ${type?.nameFr || "?"} (${type?.slug}): ${s._count}`);
}

await prisma.$disconnect();
