/**
 * Planche-contact d'un dossier d'images (captures ou pages PDF converties par pdftoppm).
 *   node sheet.js <dossier> <sortie.png> [colonnes=3]
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const dir = process.argv[2] || 'shots';
  const out = process.argv[3] || 'sheet.png';
  const cols = Number(process.argv[4] || 3);
  const files = fs.readdirSync(dir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();
  const html = `<html><body style="margin:0;background:#ddd;font-family:sans-serif"><div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;padding:8px">${files.map((f) => `<figure style="margin:0;background:#fff;padding:3px"><img src="file://${path.resolve(dir, f)}" style="width:100%;display:block;border:1px solid #bbb"><figcaption style="font-size:11px;padding:2px">${f}</figcaption></figure>`).join('')}</div></body></html>`;
  const tmp = path.resolve(out + '.html');
  fs.writeFileSync(tmp, html);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: cols >= 4 ? 1400 : 1500, height: 900 } });
  await p.goto('file://' + tmp);
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
  fs.unlinkSync(tmp);
  console.log(out, ':', files.length, 'image(s)');
})();
