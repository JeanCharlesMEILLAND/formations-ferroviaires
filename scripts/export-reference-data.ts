#!/usr/bin/env tsx
/**
 * Exporte le jeu de données de référence depuis la base vers prisma/data/*.json.
 * Périmètre : référentiels (régions, types, niveaux, domaines), formations, métiers, liens,
 * et les établissements vérifiés (tout sauf l'import automatique « api », qui se rejoue depuis le back-office).
 * Les fichiers produits sont versionnés : c'est eux que `prisma/seed.ts` recharge.
 *   npx tsx scripts/export-reference-data.ts
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const OUT = path.join(process.cwd(), "prisma", "data");

function write(name: string, rows: unknown[]) {
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(rows, null, 2) + "\n");
  console.log(`  ${name}: ${rows.length}`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const [regions, types, levels, domains, formations, metiers, establishments, metierFormations, establishmentFormations] = await Promise.all([
    prisma.region.findMany({ orderBy: { code: "asc" }, select: { code: true, name: true, lat: true, lng: true } }),
    prisma.establishmentType.findMany({ orderBy: { slug: "asc" }, select: { slug: true, nameFr: true, nameEn: true, color: true } }),
    prisma.formationLevel.findMany({ orderBy: { order: "asc" }, select: { slug: true, nameFr: true, nameEn: true, order: true } }),
    prisma.formationDomain.findMany({ orderBy: { slug: "asc" }, select: { slug: true, nameFr: true, nameEn: true, color: true } }),
    prisma.formation.findMany({ orderBy: { slug: "asc" }, select: { slug: true, nameFr: true, nameEn: true, rncpCode: true, romeCode: true, onisepUrl: true, jobTarget: true, level: { select: { slug: true } }, domain: { select: { slug: true } } } }),
    prisma.metier.findMany({ orderBy: { slug: "asc" }, select: { slug: true, nameFr: true, nameEn: true, family: true, source: true, level: true } }),
    prisma.establishment.findMany({ where: { source: { not: "api" } }, orderBy: { slug: "asc" }, select: { slug: true, name: true, city: true, address: true, lat: true, lng: true, website: true, onisepUrl: true, uaiCode: true, source: true, type: { select: { slug: true } }, region: { select: { code: true } } } }),
    prisma.metierFormation.findMany({ select: { metier: { select: { slug: true } }, formation: { select: { slug: true } } } }),
    prisma.establishmentFormation.findMany({ where: { establishment: { source: { not: "api" } } }, select: { establishment: { select: { slug: true } }, formation: { select: { slug: true } } } }),
  ]);

  console.log("Export vers prisma/data/ :");
  write("regions", regions);
  write("establishment-types", types);
  write("formation-levels", levels);
  write("formation-domains", domains);
  write("formations", formations.map((f) => ({ ...f, level: f.level.slug, domain: f.domain.slug })));
  write("metiers", metiers);
  write("establishments", establishments.map((e) => ({ ...e, type: e.type.slug, region: e.region.code })));
  write("metier-formations", metierFormations.map((l) => ({ metier: l.metier.slug, formation: l.formation.slug })).sort((a, b) => (a.metier + a.formation).localeCompare(b.metier + b.formation)));
  write("establishment-formations", establishmentFormations.map((l) => ({ establishment: l.establishment.slug, formation: l.formation.slug })).sort((a, b) => (a.establishment + a.formation).localeCompare(b.establishment + b.formation)));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
