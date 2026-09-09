import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadPdfFonts, woffToTtf, parseTtf } from "../src/lib/pdf-fonts";
import { PdfDoc } from "../src/lib/pdf";
import fs from "node:fs";

const dir = path.join(process.cwd(), "src", "assets", "fonts");

test("woffToTtf reconstruit un TrueType lisible avec ses tables", () => {
  const ttf = woffToTtf(fs.readFileSync(path.join(dir, "manrope-latin-400-normal.woff")));
  assert.equal(ttf.readUInt32BE(0), 0x00010000, "signature TrueType");
  const f = parseTtf("Manrope-Regular", ttf);
  assert.ok(f.unitsPerEm >= 1000);
  assert.ok(f.widths["A".charCodeAt(0)] > 400 && f.widths["A".charCodeAt(0)] < 900, `largeur de A : ${f.widths[65]}`);
  assert.ok(f.widths["é".charCodeAt(0)] > 300, "é présent (latin étendu)");
  assert.ok(f.widths[0x9c] > 500, "œ via CP1252");
  assert.ok(f.ascent > 700 && f.descent < 0);
});

test("les trois polices du site se chargent et s'incorporent dans le PDF", () => {
  const fonts = loadPdfFonts(dir);
  assert.deepEqual(Object.keys(fonts).sort(), ["bold", "heading", "regular"]);
  const doc = new PdfDoc(fonts);
  doc.addPage(); doc.text(50, 800, "Électrotechnique — œuvre", 12, { font: "heading" }); doc.roundRect(50, 700, 80, 20, 8, [1, 0.35, 0.21]);
  const s = doc.build().toString("latin1");
  assert.equal((s.match(/\/FontFile2/g) || []).length, 3);
  assert.ok(s.includes("/BaseFont /BricolageGrotesque-ExtraBold") && s.includes("/Subtype /TrueType"));
  const w1 = doc.width("Formations", 12, "heading"), w2 = doc.width("Formations", 12, "regular");
  assert.ok(w1 > 40 && w2 > 40 && w1 !== w2, "mesures issues des polices embarquées");
});

test("l'espacement de caractères est remis à zéro à chaque texte et compté dans la mesure", () => {
  const doc = new PdfDoc(loadPdfFonts(dir));
  doc.addPage(); doc.text(50, 800, "TITRE", 8, { font: "bold", charSpacing: 0.6 }); doc.text(50, 780, "Suite", 10);
  const s = doc.build().toString("latin1");
  assert.ok(/0\.6 Tc/.test(s) && /\/F1 10 Tf 0 Tc/.test(s), "Tc explicite sur chaque texte");
  assert.ok(doc.width("ABC", 10, "bold", 0.5) - doc.width("ABC", 10, "bold") > 1.4);
});
