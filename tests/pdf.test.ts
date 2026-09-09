import { test } from "node:test";
import assert from "node:assert/strict";
import { PdfDoc, toWinAnsi, wrap, textWidth } from "../src/lib/pdf";

test("toWinAnsi garde les accents, échappe les parenthèses, remplace l'inconnu", () => {
  assert.equal(toWinAnsi("Élève (Lyon) \\"), "Élève \\(Lyon\\) \\\\");
  assert.equal(toWinAnsi("œuvre – …").charCodeAt(0), 0x9c);
  assert.equal(toWinAnsi("中"), "?");
});

test("wrap coupe sur les espaces et respecte la largeur", () => {
  const lines = wrap("Bac Pro Maintenance des Systèmes de Traction Électrique", 120, 10);
  assert.ok(lines.length >= 2);
  for (const l of lines) assert.ok(textWidth(l, 10) <= 120, l);
  assert.equal(wrap("", 100, 10).length, 1);
});

test("build produit un PDF valide avec ses pages, polices et lien", () => {
  const doc = new PdfDoc();
  doc.addPage(); doc.text(50, 800, "Bonjour « Électrotechnique »", 12, { bold: true }); doc.link(50, 790, 100, 14, "https://example.org/é");
  doc.addPage(); doc.line(50, 700, 500, 700); doc.rect(50, 600, 100, 20, [1, 0, 0]);
  const buf = doc.build(); const s = buf.toString("latin1");
  assert.ok(s.startsWith("%PDF-1.4"));
  assert.ok(s.trimEnd().endsWith("%%EOF"));
  assert.equal((s.match(/\/Type \/Page\b/g) || []).length, 2);
  assert.ok(s.includes("/Helvetica-Bold") && s.includes("/Subtype /Link"));
  const start = Number(s.match(/startxref\n(\d+)/)?.[1]);
  assert.equal(s.slice(start, start + 4), "xref", "la table xref est à l'offset annoncé");
});
