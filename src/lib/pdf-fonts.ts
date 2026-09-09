/**
 * Polices TrueType pour le PDF : conversion WOFF (v1) → TTF, lecture des métriques (cmap, hmtx, head, hhea, OS/2)
 * et largeurs pour l'encodage WinAnsi. Aucune dépendance : zlib de Node suffit.
 */
import { inflateSync } from "node:zlib";
import fs from "node:fs";
import path from "node:path";

export interface EmbeddedFont {
  name: string;
  ttf: Buffer;
  unitsPerEm: number;
  ascent: number;
  descent: number;
  capHeight: number;
  bbox: [number, number, number, number];
  /** Largeur (unités de la police) de chaque code WinAnsi 0..255. */
  widths: number[];
}

/** Code WinAnsi (CP1252) → point de code Unicode. */
const CP1252_TO_UNICODE: Record<number, number> = { 0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02c6, 0x89: 0x2030, 0x8a: 0x0160, 0x8b: 0x2039, 0x8c: 0x0152, 0x8e: 0x017d, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014, 0x98: 0x02dc, 0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a, 0x9c: 0x0153, 0x9e: 0x017e, 0x9f: 0x0178 };
export const winAnsiToUnicode = (code: number): number => (code >= 0x80 && code <= 0x9f ? CP1252_TO_UNICODE[code] ?? 0 : code);

/** WOFF 1.0 → TrueType : chaque table est dégonflée puis réécrite avec son répertoire. */
export function woffToTtf(woff: Buffer): Buffer {
  if (woff.toString("latin1", 0, 4) !== "wOFF") throw new Error("pas un fichier WOFF");
  const flavor = woff.readUInt32BE(4);
  const numTables = woff.readUInt16BE(12);
  const tables: Array<{ tag: string; data: Buffer; checksum: number }> = [];
  for (let i = 0; i < numTables; i++) {
    const o = 44 + i * 20;
    const tag = woff.toString("latin1", o, o + 4);
    const offset = woff.readUInt32BE(o + 4), compLength = woff.readUInt32BE(o + 8), origLength = woff.readUInt32BE(o + 12), checksum = woff.readUInt32BE(o + 16);
    const raw = woff.subarray(offset, offset + compLength);
    tables.push({ tag, data: compLength < origLength ? inflateSync(raw) : Buffer.from(raw), checksum });
  }
  tables.sort((a, b) => (a.tag < b.tag ? -1 : 1));
  let entrySelector = 0; while (1 << (entrySelector + 1) <= numTables) entrySelector++;
  const searchRange = (1 << entrySelector) * 16;
  const header = Buffer.alloc(12 + numTables * 16);
  header.writeUInt32BE(flavor, 0); header.writeUInt16BE(numTables, 4); header.writeUInt16BE(searchRange, 6); header.writeUInt16BE(entrySelector, 8); header.writeUInt16BE(numTables * 16 - searchRange, 10);
  let offset = header.length;
  const chunks: Buffer[] = [];
  tables.forEach((t, i) => {
    const o = 12 + i * 16;
    header.write(t.tag, o, 4, "latin1"); header.writeUInt32BE(t.checksum, o + 4); header.writeUInt32BE(offset, o + 8); header.writeUInt32BE(t.data.length, o + 12);
    const padded = (t.data.length + 3) & ~3;
    chunks.push(t.data, Buffer.alloc(padded - t.data.length));
    offset += padded;
  });
  return Buffer.concat([header, ...chunks]);
}

function tableOffsets(ttf: Buffer): Record<string, [number, number]> {
  const n = ttf.readUInt16BE(4);
  const out: Record<string, [number, number]> = {};
  for (let i = 0; i < n; i++) { const o = 12 + i * 16; out[ttf.toString("latin1", o, o + 4)] = [ttf.readUInt32BE(o + 8), ttf.readUInt32BE(o + 12)]; }
  return out;
}

/** Table cmap (plateforme 3, encodage 1, format 4) : Unicode → identifiant de glyphe. */
function cmapLookup(ttf: Buffer, cmapOffset: number): (u: number) => number {
  const n = ttf.readUInt16BE(cmapOffset + 2);
  let sub = -1;
  for (let i = 0; i < n; i++) {
    const o = cmapOffset + 4 + i * 8;
    const platform = ttf.readUInt16BE(o), encoding = ttf.readUInt16BE(o + 2);
    if ((platform === 3 && encoding === 1) || (platform === 0 && sub < 0)) sub = cmapOffset + ttf.readUInt32BE(o + 4);
  }
  if (sub < 0 || ttf.readUInt16BE(sub) !== 4) return () => 0;
  const segX2 = ttf.readUInt16BE(sub + 6), segs = segX2 / 2;
  const ends = sub + 14, starts = ends + segX2 + 2, deltas = starts + segX2, ranges = deltas + segX2;
  return (u: number) => {
    for (let i = 0; i < segs; i++) {
      const end = ttf.readUInt16BE(ends + i * 2);
      if (u > end) continue;
      const start = ttf.readUInt16BE(starts + i * 2);
      if (u < start) return 0;
      const delta = ttf.readInt16BE(deltas + i * 2), ro = ttf.readUInt16BE(ranges + i * 2);
      if (ro === 0) return (u + delta) & 0xffff;
      const gi = ranges + i * 2 + ro + (u - start) * 2;
      if (gi + 1 >= ttf.length) return 0;
      const g = ttf.readUInt16BE(gi);
      return g === 0 ? 0 : (g + delta) & 0xffff;
    }
    return 0;
  };
}

/** Métriques utiles au PDF, à partir d'un TrueType. */
export function parseTtf(name: string, ttf: Buffer): EmbeddedFont {
  const t = tableOffsets(ttf);
  const need = (k: string) => { if (!t[k]) throw new Error(`table ${k} absente`); return t[k][0]; };
  const head = need("head"), hhea = need("hhea"), hmtx = need("hmtx"), cmap = need("cmap");
  const unitsPerEm = ttf.readUInt16BE(head + 18);
  const bbox: [number, number, number, number] = [ttf.readInt16BE(head + 36), ttf.readInt16BE(head + 38), ttf.readInt16BE(head + 40), ttf.readInt16BE(head + 42)];
  const ascent = ttf.readInt16BE(hhea + 4), descent = ttf.readInt16BE(hhea + 6);
  const numH = ttf.readUInt16BE(hhea + 34);
  const os2 = t["OS/2"]?.[0];
  const capHeight = os2 && ttf.readUInt16BE(os2) >= 2 ? ttf.readInt16BE(os2 + 88) : Math.round(ascent * 0.72);
  const glyph = cmapLookup(ttf, cmap);
  const advance = (gid: number) => ttf.readUInt16BE(hmtx + Math.min(gid, numH - 1) * 4);
  const widths: number[] = [];
  for (let code = 0; code < 256; code++) {
    const u = code < 32 ? 0 : winAnsiToUnicode(code);
    widths.push(u ? advance(glyph(u)) : 0);
  }
  const scale = 1000 / unitsPerEm;
  return { name, ttf, unitsPerEm, ascent: Math.round(ascent * scale), descent: Math.round(descent * scale), capHeight: Math.round(capHeight * scale), bbox: bbox.map((v) => Math.round(v * scale)) as [number, number, number, number], widths: widths.map((w) => Math.round(w * scale)) };
}

const FONT_FILES = {
  regular: ["Manrope-Regular", "manrope-latin-400-normal.woff"],
  bold: ["Manrope-Bold", "manrope-latin-700-normal.woff"],
  heading: ["BricolageGrotesque-ExtraBold", "bricolage-grotesque-latin-800-normal.woff"],
} as const;
export type PdfFontKey = keyof typeof FONT_FILES;

let cache: Partial<Record<PdfFontKey, EmbeddedFont>> | null = null;

/** Les trois polices du site, converties une fois par instance ; objet vide si les fichiers manquent (repli Helvetica). */
export function loadPdfFonts(dir = path.join(process.cwd(), "src", "assets", "fonts")): Partial<Record<PdfFontKey, EmbeddedFont>> {
  if (cache) return cache;
  const out: Partial<Record<PdfFontKey, EmbeddedFont>> = {};
  for (const [key, [name, file]] of Object.entries(FONT_FILES) as Array<[PdfFontKey, readonly [string, string]]>) {
    try { out[key] = parseTtf(name, woffToTtf(fs.readFileSync(path.join(dir, file)))); }
    catch (err) { console.error(`police ${file} :`, err); }
  }
  cache = out;
  return out;
}
