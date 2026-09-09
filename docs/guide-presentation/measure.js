/**
 * Hauteurs réelles (mm) des blocs d'une section, à la largeur utile A4 (178 mm), pour comprendre un saut de page.
 *   node measure.js doc.inlined.html [index de section = 0]
 * Une page A4 avec marges 15/17 mm offre ~265 mm de hauteur utile.
 */
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const file = process.argv[2] || 'doc.inlined.html';
  const idx = Number(process.argv[3] || 0);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 673, height: 979 } }); // 178 mm × 259 mm à 96 dpi
  await p.emulateMedia({ media: 'print' });
  await p.goto('file://' + path.resolve(file), { waitUntil: 'networkidle' });
  const rows = await p.evaluate((i) => {
    const mm = (px) => (px / 96 * 25.4).toFixed(1);
    const sec = document.querySelectorAll('section')[i];
    const top = sec.getBoundingClientRect().top;
    return [...sec.children].map((el) => {
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      return `${el.tagName}.${el.className} top=${mm(r.top - top)} h=${mm(r.height)} mb=${cs.marginBottom} break-inside=${cs.breakInside}`;
    });
  }, idx);
  console.log(rows.join('\n'));
  await b.close();
})();
