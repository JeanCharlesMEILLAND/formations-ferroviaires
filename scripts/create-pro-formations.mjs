import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 1. Create new level "Certification professionnelle"
const level = await prisma.formationLevel.upsert({
  where: { slug: "certification-pro" },
  create: {
    slug: "certification-pro",
    nameFr: "Certification professionnelle",
    nameEn: "Professional Certification",
    order: 0, // Before CAP (order 1)
  },
  update: {},
});
console.log("Level:", level.slug, level.id);

// 2. Create new domain "Sécurité & Réglementation Ferroviaire"
const domain = await prisma.formationDomain.upsert({
  where: { slug: "securite-reglementation" },
  create: {
    slug: "securite-reglementation",
    nameFr: "Sécurité & Réglementation Ferroviaire",
    nameEn: "Railway Safety & Regulation",
    color: "#D32F2F",
  },
  update: {},
});
console.log("Domain:", domain.slug, domain.id);

// 3. Create professional formations
const proFormations = [
  {
    slug: "secufer",
    nameFr: "SECUFER - Sécurité des personnels en environnement ferroviaire",
    nameEn: "SECUFER - Railway Environment Safety",
    romeCode: null,
    rncpCode: null,
    jobTarget: "Formation obligatoire pour intervenir à proximité des voies ferrées. Prévention des risques ferroviaires.",
    onisepUrl: null,
  },
  {
    slug: "tes-conduite-train",
    nameFr: "TES Conduite de train (catégories A/B)",
    nameEn: "Essential Safety Tasks - Train Driving (A/B)",
    romeCode: "N4301",
    rncpCode: null,
    jobTarget: "Formation aux Tâches Essentielles de Sécurité pour la conduite de trains sur le Réseau Ferré National.",
    onisepUrl: null,
  },
  {
    slug: "licence-europeenne-conducteur",
    nameFr: "Licence européenne de conducteur de train",
    nameEn: "European Train Driver Licence",
    romeCode: "N4301",
    rncpCode: null,
    jobTarget: "Certification européenne obligatoire pour conduire des trains. Délivrée par l'EPSF.",
    onisepUrl: null,
  },
  {
    slug: "tes-agent-sol",
    nameFr: "TES Agent au sol (catégories C/D)",
    nameEn: "Essential Safety Tasks - Ground Agent (C/D)",
    romeCode: null,
    rncpCode: null,
    jobTarget: "Opérateur au sol, formation des trains, manœuvres ferroviaires.",
    onisepUrl: null,
  },
  {
    slug: "tes-signalisation",
    nameFr: "TES Signalisation (catégories E/F)",
    nameEn: "Essential Safety Tasks - Signalling (E/F)",
    romeCode: null,
    rncpCode: null,
    jobTarget: "Gestion de la signalisation ferroviaire, aiguillage, régulation.",
    onisepUrl: null,
  },
  {
    slug: "tes-maintenance-infra",
    nameFr: "TES Maintenance infrastructure (catégories G à M)",
    nameEn: "Essential Safety Tasks - Infrastructure Maintenance (G-M)",
    romeCode: null,
    rncpCode: null,
    jobTarget: "Annonceur/sentinelle, travaux sur voie, maintenance caténaire, ouvrages d'art.",
    onisepUrl: null,
  },
];

const formationIds = {};
for (const f of proFormations) {
  const formation = await prisma.formation.upsert({
    where: { slug: f.slug },
    create: {
      slug: f.slug,
      nameFr: f.nameFr,
      nameEn: f.nameEn,
      romeCode: f.romeCode,
      rncpCode: f.rncpCode,
      levelId: level.id,
      domainId: domain.id,
      jobTarget: f.jobTarget,
      onisepUrl: f.onisepUrl,
    },
    update: {},
  });
  formationIds[f.slug] = formation.id;
  console.log("Formation:", f.slug, formation.id);
}

// 4. Define which centers offer which formations
// Based on EPSF PDF + research
const centerFormations = {
  // All 21 EPSF-accredited driving schools offer conduite + licence
  "ciffco-coquelles": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur", "tes-agent-sol", "tes-maintenance-infra"],
  "omnifer-saint-laurent": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur", "tes-agent-sol", "tes-maintenance-infra"],
  "ikn-formation-biard": ["secufer", "tes-agent-sol", "tes-maintenance-infra"],
  "gtif-saint-pierre-des-corps": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur", "tes-agent-sol", "tes-signalisation", "tes-maintenance-infra"],
  "digirail-le-havre": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur", "tes-maintenance-infra"],
  "etf-academy-beauchamp": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur", "tes-maintenance-infra"],
  "captrain-formation-creutzwald": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur", "tes-agent-sol"],
  "sferis-formation-autun": ["secufer", "tes-signalisation", "tes-maintenance-infra"],
  "campusfer-nimes": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur", "tes-maintenance-infra"],
  "campusfer-hazebrouck": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur", "tes-maintenance-infra"],
  "ferrotrainjob-paris": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur"],
  "formafer-chevigny": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur"],
  "egr-buc": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur", "tes-agent-sol", "tes-signalisation", "tes-maintenance-infra"],
  "ca2p-quincy-sous-senart": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur"],
  "lineas-academy-lille": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur"],
  "hexafret-campus-saint-ouen": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur", "tes-agent-sol"],
  "plate-forme-nge-tarascon": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur", "tes-maintenance-infra"],
  "db-cargo-france-aubervilliers": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur", "tes-agent-sol"],
  "alstom-training-saint-ouen": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur"],
  "academie-transdev-issy": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur"],
  "ratp-formation-paris": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur"],
  "sncf-voyageurs-unft-saint-denis": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur", "tes-agent-sol", "tes-signalisation", "tes-maintenance-infra"],
  "formarail-ballan-mire": ["secufer", "tes-maintenance-infra"],
  "fma-formation-agen": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur", "tes-maintenance-infra"],
  // CampusFER Grenay (main site)
  "campus-fer-grenay": ["secufer", "tes-conduite-train", "licence-europeenne-conducteur", "tes-agent-sol", "tes-signalisation", "tes-maintenance-infra"],
};

// 5. First remove old "Titre Pro Conducteur" links from pro centers, then add correct ones
const titrePro = await prisma.formation.findFirst({ where: { slug: "titre-pro-conducteur-train" } });

let totalLinks = 0;
for (const [slug, formSlugs] of Object.entries(centerFormations)) {
  const est = await prisma.establishment.findFirst({
    where: { OR: [{ slug }, { slug: { startsWith: slug } }] },
  });
  if (!est) {
    console.log("SKIP:", slug);
    continue;
  }

  // Remove old Titre Pro link
  if (titrePro) {
    await prisma.establishmentFormation.deleteMany({
      where: { establishmentId: est.id, formationId: titrePro.id },
    });
  }

  // Add new pro formations
  let linked = 0;
  for (const fSlug of formSlugs) {
    const fId = formationIds[fSlug];
    if (!fId) continue;
    try {
      await prisma.establishmentFormation.create({
        data: { establishmentId: est.id, formationId: fId },
      });
      linked++;
    } catch {
      // Already exists
    }
  }
  totalLinks += linked;
  console.log(`${est.name}: ${linked} certifications pro`);
}

console.log("\nTotal links created:", totalLinks);

// Stats
const totalFormations = await prisma.formation.count();
const proCount = await prisma.formation.count({ where: { levelId: level.id } });
console.log(`Formations: ${totalFormations} total (${proCount} certifications pro, ${totalFormations - proCount} académiques)`);

await prisma.$disconnect();
