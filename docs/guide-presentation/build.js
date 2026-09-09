/**
 * HTML → PDF A4 avec Playwright/Chromium.
 *   node build.js --in doc.html --out Doc.pdf [--shots shots] [--logo <url de page | url d'image | fichier>] [--footer "texte"]
 * - {{logo}}      : remplacé par le logo (si --logo est une page web, on prend la 1re image de <nav>/<header>)
 * - {{nom}}       : remplacé par shots/nom.png en base64
 * - grilles .cards .principles .channels .contact .two .visibility → tableaux (Chromium coupe mal les grilles entre les pages)
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const IN = arg('--in', 'doc.html');
const OUT = arg('--out', 'document.pdf');
const SHOTS = arg('--shots', 'shots');
const LOGO = arg('--logo', '');
const FOOTER = arg('--footer', path.basename(OUT, '.pdf'));

const mimeOf = (p) => { const e = p.split('?')[0].split('.').pop().toLowerCase(); return e === 'svg' ? 'image/svg+xml' : e === 'webp' ? 'image/webp' : e === 'jpg' || e === 'jpeg' ? 'image/jpeg' : 'image/png'; };

(async () => {
  const browser = await chromium.launch();
  let logo = '';
  if (LOGO) {
    try {
      if (/^https?:/.test(LOGO) && !/\.(png|jpe?g|webp|svg)(\?|$)/i.test(LOGO)) {
        const p0 = await browser.newPage();
        await p0.goto(LOGO, { waitUntil: 'domcontentloaded', timeout: 60000 });
        const src = await p0.evaluate(() => { const img = document.querySelector('nav img, header img'); return img ? img.currentSrc || img.src : ''; });
        await p0.close();
        if (src) logo = `data:${mimeOf(src)};base64,${Buffer.from(await (await fetch(src)).arrayBuffer()).toString('base64')}`;
      } else if (/^https?:/.test(LOGO)) {
        logo = `data:${mimeOf(LOGO)};base64,${Buffer.from(await (await fetch(LOGO)).arrayBuffer()).toString('base64')}`;
      } else if (fs.existsSync(LOGO)) {
        logo = `data:${mimeOf(LOGO)};base64,${fs.readFileSync(LOGO).toString('base64')}`;
      }
      console.log('logo :', logo ? `${Math.round(logo.length / 1024)} Ko` : 'introuvable');
    } catch (e) { console.log('logo : erreur', e.message.slice(0, 80)); }
  }
  let html = fs.readFileSync(IN, 'utf8').replace(/\{\{logo\}\}/g, logo);
  if (fs.existsSync(SHOTS)) {
    for (const f of fs.readdirSync(SHOTS).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))) {
      const key = f.replace(/\.[a-z]+$/i, '');
      html = html.split(`{{${key}}}`).join(`data:${mimeOf(f)};base64,${fs.readFileSync(path.join(SHOTS, f)).toString('base64')}`);
    }
  }
  const missing = html.match(/\{\{[a-z0-9-]+\}\}/gi);
  if (missing) console.log('placeholders sans image :', [...new Set(missing)].join(' '));
  const inlined = IN.replace(/\.html$/, '') + '.inlined.html';
  fs.writeFileSync(inlined, html);

  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(inlined), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    const conv = (selector, cols) => {
      document.querySelectorAll(selector).forEach((grid) => {
        const items = [...grid.children];
        const table = document.createElement('table');
        table.className = 'gridtable ' + grid.className;
        const tbody = document.createElement('tbody');
        table.appendChild(tbody);
        let tr;
        items.forEach((it, i) => {
          if (i % cols === 0) { tr = document.createElement('tr'); tbody.appendChild(tr); }
          const td = document.createElement('td');
          td.appendChild(it);
          tr.appendChild(td);
        });
        const rem = items.length % cols;
        if (rem) for (let k = rem; k < cols; k++) tr.appendChild(document.createElement('td'));
        grid.replaceWith(table);
      });
    };
    conv('.cards', 2); conv('.principles', 3); conv('.channels', 3); conv('.contact', 2); conv('.two', 2); conv('.visibility', 2);
  });
  await page.pdf({
    path: OUT,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `<div style="width:100%;font-family:Arial,sans-serif;font-size:8pt;color:#777;padding:0 16mm;display:flex;justify-content:space-between;align-items:center"><span>${FOOTER.replace(/</g, '&lt;')}</span><span>page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  });
  await browser.close();
  console.log('PDF :', OUT, (fs.statSync(OUT).size / 1024 / 1024).toFixed(1), 'Mo');
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
