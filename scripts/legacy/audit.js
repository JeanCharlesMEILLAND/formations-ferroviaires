const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const metiers = await p.metier.findMany({ include: { formations: true }, orderBy: { nameFr: 'asc' } });
  console.log('=== METIERS ===');
  for (const m of metiers) {
    const estCount = await p.establishment.count({
      where: { formations: { some: { formation: { metiers: { some: { metierId: m.id } } } } } }
    });
    const pad = m.nameFr.padEnd(55);
    const flag = estCount < 5 ? ' ⚠️' : '';
    console.log(pad + ' | ' + String(m.formations.length).padStart(2) + ' form | ' + String(estCount).padStart(3) + ' etab' + flag);
  }

  console.log('\n=== FORMATIONS ===');
  const formations = await p.formation.findMany({
    include: { establishments: true, metiers: true },
    orderBy: [{ level: { order: 'asc' } }, { nameFr: 'asc' }]
  });
  for (const f of formations) {
    const pad = f.nameFr.padEnd(65);
    const flag1 = f.establishments.length === 0 ? ' ⚠️ 0etab' : '';
    const flag2 = f.metiers.length === 0 ? ' ⚠️ 0metier' : '';
    console.log(pad + ' | ' + String(f.establishments.length).padStart(3) + ' etab | ' + String(f.metiers.length).padStart(2) + ' met' + flag1 + flag2);
  }

  await p.$disconnect();
}
main();
