/**
 * Générateur PDF minimal, sans dépendance : pages A4, texte Helvetica (normal et gras) en WinAnsi,
 * traits, rectangles, liens cliquables. Suffisant pour une liste à emporter ; testé dans tests/pdf.test.ts.
 */
import { deflateSync } from "node:zlib";
import type { EmbeddedFont, PdfFontKey } from "./pdf-fonts";

export const PAGE = { w: 595.28, h: 841.89 };
export type RGB = [number, number, number];
export type FontKey = PdfFontKey;

const PUNCT: Record<string, number> = { " ": 278, "!": 278, '"': 355, "#": 556, $: 556, "%": 889, "&": 667, "'": 191, "(": 333, ")": 333, "*": 389, "+": 584, ",": 278, "-": 333, ".": 278, "/": 278, ":": 278, ";": 278, "<": 584, "=": 584, ">": 584, "?": 556, "@": 1015, "[": 278, "\\": 278, "]": 278, "^": 469, _: 556, "`": 333, "{": 334, "|": 260, "}": 334, "~": 584, "«": 556, "»": 556, "•": 350, "–": 556, "—": 1000, "’": 222, "…": 1000, "€": 556 };
const UPPER: Record<string, number> = { A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 500, K: 667, L: 556, M: 833, N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611 };
const LOWER: Record<string, number> = { a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222, j: 222, k: 500, l: 222, m: 833, n: 556, o: 556, p: 556, q: 556, r: 333, s: 500, t: 278, u: 556, v: 500, w: 722, x: 500, y: 500, z: 500 };

function charWidth(ch: string): number {
  if (ch >= "0" && ch <= "9") return 556;
  if (PUNCT[ch] !== undefined) return PUNCT[ch];
  const base = ch.normalize("NFD")[0];
  if (UPPER[base] !== undefined) return UPPER[base];
  if (LOWER[base] !== undefined) return LOWER[base];
  if (ch === "œ") return 944; if (ch === "Œ") return 1000; if (ch === "ç") return 500; if (ch === "Ç") return 722;
  return 556;
}

/** Largeur approchée d'un texte en points (métriques Helvetica). */
export function textWidth(s: string, size: number, bold = false): number {
  let w = 0;
  for (const ch of s) w += charWidth(ch);
  return (w * size) / 1000 * (bold ? 1.04 : 1);
}

/** Retour à la ligne sur les espaces, coupe les mots trop longs. */
export function wrap(text: string, maxWidth: number, size: number, bold = false): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (textWidth(candidate, size, bold) <= maxWidth) { line = candidate; continue; }
      if (line) lines.push(line);
      line = word;
      while (textWidth(line, size, bold) > maxWidth && line.length > 1) {
        let cut = line.length - 1;
        while (cut > 1 && textWidth(line.slice(0, cut), size, bold) > maxWidth) cut--;
        lines.push(line.slice(0, cut));
        line = line.slice(cut);
      }
    }
    lines.push(line);
  }
  return lines.length ? lines : [""];
}

const CP1252: Record<string, number> = { "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85, "†": 0x86, "‡": 0x87, "ˆ": 0x88, "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c, "Ž": 0x8e, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b, "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f };

/** Chaîne PDF en WinAnsi (une lettre = un octet), parenthèses et barres échappées ; l'inconnu devient « ? ». */
export function toWinAnsi(s: string): string {
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 63;
    const b = code < 128 ? code : code >= 0xa0 && code <= 0xff ? code : CP1252[ch] ?? 63;
    const c = String.fromCharCode(b);
    out += c === "(" || c === ")" || c === "\\" ? `\\${c}` : c === "\n" || c === "\r" ? " " : c;
  }
  return out;
}

const num = (n: number) => (Math.round(n * 100) / 100).toString();

interface Page { ops: string[]; annots: string[] }
const FONT_RES: Record<FontKey, string> = { regular: "F1", bold: "F2", heading: "F3" };
const FALLBACK: Record<FontKey, string> = { regular: "Helvetica", bold: "Helvetica-Bold", heading: "Helvetica-Bold" };

/** Document PDF : on empile des pages, on écrit dessus, puis build() renvoie les octets. */
export class PdfDoc {
  private pages: Page[] = [];
  constructor(private fonts: Partial<Record<FontKey, EmbeddedFont>> = {}) {}
  page(): Page { return this.pages[this.pages.length - 1]; }
  get pageCount(): number { return this.pages.length; }
  addPage(): void { this.pages.push({ ops: [], annots: [] }); }

  /** Largeur d'un texte : métriques de la police embarquée, sinon Helvetica. */
  width(s: string, size: number, font: FontKey = "regular", charSpacing = 0): number {
    const f = this.fonts[font];
    const chars = toWinAnsi(s).replace(/\\([()\\])/g, "$1");
    const spacing = charSpacing * chars.length;
    if (!f) return textWidth(s, size, font !== "regular") + spacing;
    let w = 0;
    for (const ch of chars) w += f.widths[ch.charCodeAt(0)] ?? 0;
    return (w * size) / 1000 + spacing;
  }
  wrap(text: string, maxWidth: number, size: number, font: FontKey = "regular"): string[] {
    const measure = (t: string) => this.width(t, size, font);
    const lines: string[] = [];
    for (const para of text.split("\n")) {
      let line = "";
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const candidate = line ? `${line} ${word}` : word;
        if (measure(candidate) <= maxWidth) { line = candidate; continue; }
        if (line) lines.push(line);
        line = word;
        while (measure(line) > maxWidth && line.length > 1) {
          let cut = line.length - 1;
          while (cut > 1 && measure(line.slice(0, cut)) > maxWidth) cut--;
          lines.push(line.slice(0, cut)); line = line.slice(cut);
        }
      }
      lines.push(line);
    }
    return lines.length ? lines : [""];
  }

  /** Texte à la position (x, y) mesurée depuis le bas de la page. */
  text(x: number, y: number, s: string, size: number, opts: { bold?: boolean; font?: FontKey; color?: RGB; pageIndex?: number; charSpacing?: number } = {}): void {
    const p = opts.pageIndex !== undefined ? this.pages[opts.pageIndex] : this.page();
    const [r, g, b] = opts.color ?? [0.05, 0.12, 0.17];
    const font = opts.font ?? (opts.bold ? "bold" : "regular");
    const tc = ` ${num(opts.charSpacing ?? 0)} Tc`; // l'espacement fait partie de l'état graphique : on le fixe à chaque texte
    p.ops.push(`BT ${num(r)} ${num(g)} ${num(b)} rg /${FONT_RES[font]} ${num(size)} Tf${tc} 1 0 0 1 ${num(x)} ${num(y)} Tm (${toWinAnsi(s)}) Tj ET`);
  }
  line(x1: number, y1: number, x2: number, y2: number, width = 0.5, color: RGB = [0.84, 0.87, 0.88]): void {
    this.page().ops.push(`${num(color[0])} ${num(color[1])} ${num(color[2])} RG ${num(width)} w ${num(x1)} ${num(y1)} m ${num(x2)} ${num(y2)} l S`);
  }
  rect(x: number, y: number, w: number, h: number, color: RGB): void {
    this.page().ops.push(`${num(color[0])} ${num(color[1])} ${num(color[2])} rg ${num(x)} ${num(y)} ${num(w)} ${num(h)} re f`);
  }
  strokeRect(x: number, y: number, w: number, h: number, color: RGB, width = 0.6): void {
    this.page().ops.push(`${num(color[0])} ${num(color[1])} ${num(color[2])} RG ${num(width)} w ${num(x)} ${num(y)} ${num(w)} ${num(h)} re S`);
  }
  /** Rectangle à coins arrondis (pastilles, cartes). */
  roundRect(x: number, y: number, w: number, h: number, r: number, fill?: RGB, stroke?: RGB, lw = 0.6): void {
    const k = 0.5523 * r;
    const d = [
      `${num(x + r)} ${num(y)} m`, `${num(x + w - r)} ${num(y)} l`,
      `${num(x + w - r + k)} ${num(y)} ${num(x + w)} ${num(y + r - k)} ${num(x + w)} ${num(y + r)} c`, `${num(x + w)} ${num(y + h - r)} l`,
      `${num(x + w)} ${num(y + h - r + k)} ${num(x + w - r + k)} ${num(y + h)} ${num(x + w - r)} ${num(y + h)} c`, `${num(x + r)} ${num(y + h)} l`,
      `${num(x + r - k)} ${num(y + h)} ${num(x)} ${num(y + h - r + k)} ${num(x)} ${num(y + h - r)} c`, `${num(x)} ${num(y + r)} l`,
      `${num(x)} ${num(y + r - k)} ${num(x + r - k)} ${num(y)} ${num(x + r)} ${num(y)} c h`,
    ].join(" ");
    const ops: string[] = [];
    if (fill) ops.push(`${num(fill[0])} ${num(fill[1])} ${num(fill[2])} rg`);
    if (stroke) ops.push(`${num(stroke[0])} ${num(stroke[1])} ${num(stroke[2])} RG ${num(lw)} w`);
    ops.push(d, fill && stroke ? "B" : fill ? "f" : "S");
    this.page().ops.push(ops.join(" "));
  }
  link(x: number, y: number, w: number, h: number, url: string): void {
    this.page().annots.push(`<< /Type /Annot /Subtype /Link /Rect [${num(x)} ${num(y)} ${num(x + w)} ${num(y + h)}] /Border [0 0 0] /A << /S /URI /URI (${toWinAnsi(url)}) >> >>`);
  }

  build(): Buffer {
    const objects: Array<string | Buffer> = [];
    const add = (o: string | Buffer) => { objects.push(o); return objects.length; };
    add(""); // 1 : catalogue
    add(""); // 2 : pages
    const fontIds: Record<FontKey, number> = { regular: 0, bold: 0, heading: 0 };
    for (const key of ["regular", "bold", "heading"] as FontKey[]) {
      const f = this.fonts[key];
      if (!f) { fontIds[key] = add(`<< /Type /Font /Subtype /Type1 /BaseFont /${FALLBACK[key]} /Encoding /WinAnsiEncoding >>`); continue; }
      const data = deflateSync(f.ttf);
      const file = add(Buffer.concat([Buffer.from(`<< /Length ${data.length} /Length1 ${f.ttf.length} /Filter /FlateDecode >>\nstream\n`, "latin1"), data, Buffer.from("\nendstream", "latin1")]));
      const desc = add(`<< /Type /FontDescriptor /FontName /${f.name} /Flags 32 /FontBBox [${f.bbox.join(" ")}] /ItalicAngle 0 /Ascent ${f.ascent} /Descent ${f.descent} /CapHeight ${f.capHeight} /StemV 80 /FontFile2 ${file} 0 R >>`);
      fontIds[key] = add(`<< /Type /Font /Subtype /TrueType /BaseFont /${f.name} /FirstChar 32 /LastChar 255 /Widths [${f.widths.slice(32).join(" ")}] /Encoding /WinAnsiEncoding /FontDescriptor ${desc} 0 R >>`);
    }
    const pageIds: number[] = [];
    for (const p of this.pages) {
      const content = p.ops.join("\n");
      const c = add(`<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`);
      const annots = p.annots.length ? ` /Annots [${p.annots.map((a) => add(a)).map((id) => `${id} 0 R`).join(" ")}]` : "";
      pageIds.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(PAGE.w)} ${num(PAGE.h)}] /Resources << /Font << /F1 ${fontIds.regular} 0 R /F2 ${fontIds.bold} 0 R /F3 ${fontIds.heading} 0 R >> >> /Contents ${c} 0 R${annots} >>`));
    }
    objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

    const parts: Buffer[] = [Buffer.from("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n", "latin1")];
    let length = parts[0].length;
    const offsets: number[] = [];
    objects.forEach((o, i) => {
      const body = Buffer.isBuffer(o) ? o : Buffer.from(o, "latin1");
      const chunk = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`, "latin1"), body, Buffer.from("\nendobj\n", "latin1")]);
      offsets.push(length); parts.push(chunk); length += chunk.length;
    });
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const off of offsets) xref += `${off.toString().padStart(10, "0")} 00000 n \n`;
    xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF\n`;
    parts.push(Buffer.from(xref, "latin1"));
    return Buffer.concat(parts);
  }
}
