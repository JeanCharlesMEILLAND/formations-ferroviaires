// Parcours de test « personas » (Playwright). Prérequis : un serveur local (npm run build && npx next start -p 3100)
// et Playwright disponible (par exemple installé dans un dossier à part : npm i playwright && npx playwright install chromium-headless-shell),
// puis : NODE_PATH=<dossier>/node_modules node scripts/qa/personas.js. Les captures vont dans scripts/qa/personas/.
// Le parcours « Dupont » envoie un vrai message de contact (qa-persona@example.org) : à supprimer ensuite dans le back-office.

const { chromium } = require('playwright');
const BASE = 'http://localhost:3100';
const out = (name) => `${__dirname}/personas/${name}.png`;
const log = [];
const check = (persona, step, ok, detail) => { log.push(`${ok ? 'OK ' : 'KO '} [${persona}] ${step}${detail ? ' → ' + detail : ''}`); };
const txt = async (loc) => ((await loc.textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim();

(async () => {
  const b = await chromium.launch();
  const errs = [];
  const page = async (opts = {}) => { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ...opts }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); return [ctx, p]; };

  // 1. Lina, 16 ans, Lille : « je veux conduire des trains, où je peux me former près de chez moi ? »
  {
    const [ctx, p] = await page({ geolocation: { latitude: 50.63, longitude: 3.06 }, permissions: ['geolocation'] });
    await p.goto(`${BASE}/fr`, { waitUntil: 'networkidle' });
    await p.locator('.search-field input').first().fill('conducteur de train'); await p.waitForTimeout(900);
    const sug = await p.locator('.sug-item').allTextContents();
    check('Lina', 'suggestions pour « conducteur de train »', sug.length > 0, sug.slice(0, 3).map((s) => s.replace(/\s+/g, ' ').trim()).join(' | '));
    await p.keyboard.press('Enter'); await p.waitForURL(/carte/); await p.waitForTimeout(3000);
    const title = await txt(p.locator('aside h2').first()); const count = await txt(p.locator('aside p.font-heading').first());
    check('Lina', 'carte : titre et compteur', /conducteur/i.test(title) && /\d+ établissement/.test(count), `${title} · ${count}`);
    await p.getByRole('button', { name: /Près de moi/ }).first().click(); await p.waitForTimeout(2500);
    const first = await txt(p.locator('.result-row').first());
    check('Lina', 'près de moi : premier résultat avec distance, dans le Nord', /km/.test(first) && /Hauts-de-France|Lille|Nord|Grenay|Hazebrouck|Valenciennes|Arras|Douai/i.test(first), first.slice(0, 120));
    await p.screenshot({ path: out('1-lina-pres-de-moi') });
    await p.locator('.result-row').first().click(); await p.waitForTimeout(2200);
    const card = await txt(p.locator('.est-card').first());
    check('Lina', 'fiche flottante avec formations et bouton fiche', /FORMATION/i.test(card) && /Voir la fiche/.test(card), card.slice(0, 100));
    await ctx.close();
  }

  // 2. Karim, 34 ans, reconversion : « une certification courte en Occitanie »
  {
    const [ctx, p] = await page();
    await p.goto(`${BASE}/fr`, { waitUntil: 'networkidle' });
    await p.getByRole('link', { name: 'Reconversion' }).click(); await p.waitForURL(/carte/); await p.waitForTimeout(3000);
    let kicker = await txt(p.locator('aside p.uppercase').first()); let title = await txt(p.locator('aside h2').first());
    check('Karim', 'puce Reconversion → contexte niveau', /Niveau/i.test(kicker) && /Certification/i.test(title), `${kicker} · ${title}`);
    await p.getByRole('button', { name: /Filtres/ }).first().click(); await p.waitForTimeout(500);
    await p.locator('aside select').nth(2).selectOption({ label: 'Occitanie' }); await p.waitForTimeout(1500);
    const count = await txt(p.locator('aside p.font-heading').first());
    const chips = await p.locator('aside .chip.is-on.chip-sm').allTextContents();
    check('Karim', 'filtre région Occitanie appliqué', /Occitanie/.test(chips.join(' ')) && !/^0 /.test(count), `${count} · ${chips.map((c) => c.trim()).join(' / ')}`);
    await p.getByRole('tab', { name: /Formations/ }).click(); await p.waitForTimeout(600);
    const forms = await p.locator('.result-title').allTextContents();
    check('Karim', 'onglet Formations : certifications courtes listées', forms.some((f) => /SECUFER|TES|Licence européenne|habilitation/i.test(f)), forms.slice(0, 4).join(' | '));
    await p.screenshot({ path: out('2-karim-occitanie') });
    await ctx.close();
  }

  // 3. Mme Dupont, directrice du CFA Ferroviaire de Lyon : « je veux corriger ma fiche »
  {
    const [ctx, p] = await page();
    await p.goto(`${BASE}/fr/carte`, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
    await p.locator('.search-field input').first().fill('cfa ferroviaire lyon'); await p.waitForTimeout(600);
    const first = p.locator('.sug-item').first(); const firstTxt = await txt(first);
    check('Dupont', 'suggestion établissement en tête', /CFA Ferroviaire - Lyon/i.test(firstTxt), firstTxt);
    await first.click(); await p.waitForTimeout(2500);
    const cardName = await txt(p.locator('.est-card h3').first());
    check('Dupont', 'fiche flottante ouverte sur son CFA', /Lyon/i.test(cardName), cardName);
    await p.locator('.est-card').getByRole('link', { name: /Voir la fiche/ }).click(); await p.waitForURL(/etablissement/); await p.waitForTimeout(1000);
    await p.getByRole('link', { name: /Mettre à jour cette fiche/ }).first().click(); await p.waitForURL(/contact/); await p.waitForTimeout(800);
    const est = await p.locator('input[list]').inputValue(); const kindOn = await txt(p.locator('.kind-card.is-on'));
    check('Dupont', 'formulaire pré-rempli (motif + établissement)', /Mettre à jour ma fiche/.test(kindOn) && /Lyon/.test(est), `${kindOn.slice(0, 30)} · ${est}`);
    await p.locator('input[autocomplete="name"]').fill('Test Persona'); await p.locator('input[type="email"]').fill('qa-persona@example.org');
    await p.locator('textarea').fill('Parcours de test automatique : nouvelle session de BTS à la rentrée. À supprimer.');
    await p.screenshot({ path: out('3-dupont-formulaire') });
    await p.getByRole('button', { name: /Envoyer/ }).click(); await p.waitForTimeout(3000);
    const ok = await txt(p.locator('[role="status"]').first());
    check('Dupont', 'confirmation d\'envoi', /Message envoyé/.test(ok), ok.slice(0, 60));
    await ctx.close();
  }

  // 4. Un parent qui ne connaît pas le vocabulaire et fait des fautes
  {
    const [ctx, p] = await page();
    await p.goto(`${BASE}/fr/carte`, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
    await p.locator('.search-field input').first().fill('electrisien train'); await p.waitForTimeout(800);
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    const count = await txt(p.locator('aside p.font-heading').first()); const hint = await txt(p.locator('aside [role="status"]').first());
    check('Parent', '« electrisien train » donne des résultats proches', !/^0 /.test(count), `${count} · ${hint}`);
    await p.screenshot({ path: out('4-parent-fautes'), clip: { x: 0, y: 64, width: 720, height: 520 } });
    await ctx.close();
  }

  // 5. Une conseillère d'orientation compare trois campus et emporte la liste
  {
    const [ctx, p] = await page();
    await p.goto(`${BASE}/fr/carte?q=campus`, { waitUntil: 'networkidle' }); await p.waitForTimeout(3000);
    for (let i = 0; i < 3; i++) await p.locator('.bookmark').nth(i).click();
    await p.waitForTimeout(400);
    const hdr = await txt(p.locator('header a[title]').first());
    check('Conseillère', 'trois signets → compteur', /3/.test(hdr), hdr);
    await p.locator('aside a[title]').first().click(); await p.waitForLoadState('networkidle'); await p.waitForTimeout(2500);
    const cols = (await p.locator('.compare thead th').count()) - 1; const common = await p.locator('.compare tr.is-common').count();
    check('Conseillère', 'comparateur : 3 colonnes et formations communes signalées', cols === 3, `${cols} colonnes · ${common} formations communes`);
    const pdfHref = await p.getByRole('link', { name: /PDF/ }).getAttribute('href');
    const r = await ctx.request.get(`${BASE}${pdfHref}`); const buf = await r.body();
    check('Conseillère', 'PDF téléchargeable', r.status() === 200 && buf.slice(0, 5).toString() === '%PDF-', `${buf.length} octets`);
    await p.screenshot({ path: out('5-conseillere-comparateur'), fullPage: true });
    await ctx.close();
  }

  // 6. Jules, sur son téléphone dans le bus : « un CFA à Lyon »
  {
    const [ctx, p] = await page({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await p.goto(`${BASE}/fr/carte`, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
    await p.locator('.search-field input').first().fill('lyon'); await p.waitForTimeout(800); await p.keyboard.press('Escape');
    const peek = await txt(p.locator('aside').first());
    check('Jules', 'titre et compteur visibles sans ouvrir la feuille', /« lyon »/.test(peek) && /établissement/.test(peek), peek.slice(0, 80));
    await p.locator('.sheet-handle').tap(); await p.waitForTimeout(700);
    await p.screenshot({ path: out('6-jules-mobile-liste') });
    await p.locator('.result-row').first().tap(); await p.waitForTimeout(2300);
    const card = await txt(p.locator('.est-card').first());
    check('Jules', 'fiche flottante avec itinéraire et site', /Voir la fiche/.test(card), card.slice(0, 80));
    await p.screenshot({ path: out('6-jules-mobile-fiche') });
    await ctx.close();
  }

  console.log(log.join('\n'));
  console.log('erreurs de page :', errs.length ? errs : 'aucune');
  await b.close();
})();
