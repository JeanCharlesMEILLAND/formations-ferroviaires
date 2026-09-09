/**
 * Recharge le jeu de données de référence (prisma/data/*.json) : idempotent, clé = slug ou code.
 * Ne touche pas aux établissements importés automatiquement (source « api »), qui se rejouent depuis le back-office.
 *   npm run db:seed
 * Pour régénérer les JSON depuis la base : npx tsx scripts/export-reference-data.ts
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const DATA = path.join(process.cwd(), "prisma", "data");
const read = <T,>(name: string): T[] => JSON.parse(fs.readFileSync(path.join(DATA, `${name}.json`), "utf8"));

type Region = { code: string; name: string; lat: number; lng: number };
type Type = { slug: string; nameFr: string; nameEn: string; color: string };
type Level = { slug: string; nameFr: string; nameEn: string; order: number };
type Domain = { slug: string; nameFr: string; nameEn: string; color: string };
type Formation = { slug: string; nameFr: string; nameEn: string | null; rncpCode: string | null; romeCode: string | null; onisepUrl: string | null; jobTarget: string | null; level: string; domain: string };
type Metier = { slug: string; nameFr: string; nameEn: string | null; family: string; source: string; level: string | null };
type Establishment = { slug: string; name: string; city: string; address: string | null; lat: number; lng: number; website: string | null; onisepUrl: string | null; uaiCode: string | null; source: string; type: string; region: string };
type MF = { metier: string; formation: string };
type EF = { establishment: string; formation: string };

async function main() {
  console.log("Seed depuis prisma/data/");

  for (const r of read<Region>("regions")) await prisma.region.upsert({ where: { code: r.code }, create: r, update: { name: r.name, lat: r.lat, lng: r.lng } });
  for (const t of read<Type>("establishment-types")) await prisma.establishmentType.upsert({ where: { slug: t.slug }, create: t, update: { nameFr: t.nameFr, nameEn: t.nameEn, color: t.color } });
  for (const l of read<Level>("formation-levels")) await prisma.formationLevel.upsert({ where: { slug: l.slug }, create: l, update: { nameFr: l.nameFr, nameEn: l.nameEn, order: l.order } });
  for (const d of read<Domain>("formation-domains")) await prisma.formationDomain.upsert({ where: { slug: d.slug }, create: d, update: { nameFr: d.nameFr, nameEn: d.nameEn, color: d.color } });

  const levels = new Map((await prisma.formationLevel.findMany({ select: { id: true, slug: true } })).map((x) => [x.slug, x.id]));
  const domains = new Map((await prisma.formationDomain.findMany({ select: { id: true, slug: true } })).map((x) => [x.slug, x.id]));
  const types = new Map((await prisma.establishmentType.findMany({ select: { id: true, slug: true } })).map((x) => [x.slug, x.id]));
  const regions = new Map((await prisma.region.findMany({ select: { id: true, code: true } })).map((x) => [x.code, x.id]));

  let n = 0;
  for (const f of read<Formation>("formations")) {
    const levelId = levels.get(f.level), domainId = domains.get(f.domain);
    if (!levelId || !domainId) { console.warn(`  formation ${f.slug} : niveau ou domaine inconnu`); continue; }
    const data = { nameFr: f.nameFr, nameEn: f.nameEn, rncpCode: f.rncpCode, romeCode: f.romeCode, onisepUrl: f.onisepUrl, jobTarget: f.jobTarget, levelId, domainId };
    await prisma.formation.upsert({ where: { slug: f.slug }, create: { slug: f.slug, ...data }, update: data }); n++;
  }
  console.log(`  formations : ${n}`);

  n = 0;
  for (const m of read<Metier>("metiers")) {
    const data = { nameFr: m.nameFr, nameEn: m.nameEn, family: m.family, source: m.source, level: m.level };
    await prisma.metier.upsert({ where: { slug: m.slug }, create: { slug: m.slug, ...data }, update: data }); n++;
  }
  console.log(`  métiers : ${n}`);

  n = 0;
  for (const e of read<Establishment>("establishments")) {
    const typeId = types.get(e.type), regionId = regions.get(e.region);
    if (!typeId || !regionId) { console.warn(`  établissement ${e.slug} : type ou région inconnu`); continue; }
    const data = { name: e.name, city: e.city, address: e.address, lat: e.lat, lng: e.lng, website: e.website, onisepUrl: e.onisepUrl, uaiCode: e.uaiCode, source: e.source || "manual", typeId, regionId };
    await prisma.establishment.upsert({ where: { slug: e.slug }, create: { slug: e.slug, ...data }, update: data }); n++;
  }
  console.log(`  établissements vérifiés : ${n}`);

  const formationIds = new Map((await prisma.formation.findMany({ select: { id: true, slug: true } })).map((x) => [x.slug, x.id]));
  const metierIds = new Map((await prisma.metier.findMany({ select: { id: true, slug: true } })).map((x) => [x.slug, x.id]));
  const establishmentIds = new Map((await prisma.establishment.findMany({ select: { id: true, slug: true } })).map((x) => [x.slug, x.id]));

  n = 0;
  for (const l of read<MF>("metier-formations")) {
    const metierId = metierIds.get(l.metier), formationId = formationIds.get(l.formation);
    if (!metierId || !formationId) { console.warn(`  lien métier ${l.metier} → ${l.formation} ignoré`); continue; }
    await prisma.metierFormation.upsert({ where: { metierId_formationId: { metierId, formationId } }, create: { metierId, formationId }, update: {} }); n++;
  }
  console.log(`  liens métier-formation : ${n}`);

  n = 0;
  for (const l of read<EF>("establishment-formations")) {
    const establishmentId = establishmentIds.get(l.establishment), formationId = formationIds.get(l.formation);
    if (!establishmentId || !formationId) { console.warn(`  lien ${l.establishment} → ${l.formation} ignoré`); continue; }
    await prisma.establishmentFormation.upsert({ where: { establishmentId_formationId: { establishmentId, formationId } }, create: { establishmentId, formationId }, update: {} }); n++;
  }
  console.log(`  liens établissement-formation : ${n}`);
  console.log("Terminé.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
