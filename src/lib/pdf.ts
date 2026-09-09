/**
 * Générateur PDF minimal, sans dépendance : pages A4, texte Helvetica (normal et gras) en WinAnsi,
 * traits, rectangles, liens cliquables. Suffisant pour une liste à emporter ; testé dans tests/pdf.test.ts.
 */
export const PAGE = { w: 595.28, h: 841.89 };

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

/** Document PDF : on empile des pages, on écrit dessus, puis build() renvoie les octets. */
export class PdfDoc {
  private pages: Page[] = [];
  page(): Page { return this.pages[this.pages.length - 1]; }
  get pageCount(): number { return this.pages.length; }
  addPage(): void { this.pages.push({ ops: [], annots: [] }); }

  /** Texte à la position (x, y) mesurée depuis le bas de la page. */
  text(x: number, y: number, s: string, size: number, opts: { bold?: boolean; color?: [number, number, number]; pageIndex?: number } = {}): void {
    const p = opts.pageIndex !== undefined ? this.pages[opts.pageIndex] : this.page();
    const [r, g, b] = opts.color ?? [0.05, 0.12, 0.17];
    p.ops.push(`BT ${num(r)} ${num(g)} ${num(b)} rg /${opts.bold ? "F2" : "F1"} ${num(size)} Tf 1 0 0 1 ${num(x)} ${num(y)} Tm (${toWinAnsi(s)}) Tj ET`);
  }
  line(x1: number, y1: number, x2: number, y2: number, width = 0.5, color: [number, number, number] = [0.84, 0.87, 0.88]): void {
    this.page().ops.push(`${num(color[0])} ${num(color[1])} ${num(color[2])} RG ${num(width)} w ${num(x1)} ${num(y1)} m ${num(x2)} ${num(y2)} l S`);
  }
  rect(x: number, y: number, w: number, h: number, color: [number, number, number]): void {
    this.page().ops.push(`${num(color[0])} ${num(color[1])} ${num(color[2])} rg ${num(x)} ${num(y)} ${num(w)} ${num(h)} re f`);
  }
  link(x: number, y: number, w: number, h: number, url: string): void {
    this.page().annots.push(`<< /Type /Annot /Subtype /Link /Rect [${num(x)} ${num(y)} ${num(x + w)} ${num(y + h)}] /Border [0 0 0] /A << /S /URI /URI (${toWinAnsi(url)}) >> >>`);
  }

  build(): Buffer {
    const objects: string[] = [];
    const add = (s: string) => { objects.push(s); return objects.length; };
    add(""); // 1 : catalogue, rempli après
    add(""); // 2 : pages
    const f1 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    const f2 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    const pageIds: number[] = [];
    for (const p of this.pages) {
      const content = p.ops.join("\n");
      const c = add(`<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`);
      const annots = p.annots.length ? ` /Annots [${p.annots.map((a) => add(a)).map((id) => `${id} 0 R`).join(" ")}]` : "";
      pageIds.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(PAGE.w)} ${num(PAGE.h)}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${c} 0 R${annots} >>`));
    }
    objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

    let out = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n";
    const offsets: number[] = [];
    objects.forEach((o, i) => { offsets.push(Buffer.byteLength(out, "latin1")); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const xref = Buffer.byteLength(out, "latin1");
    out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const off of offsets) out += `${off.toString().padStart(10, "0")} 00000 n \n`;
    out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    return Buffer.from(out, "latin1");
  }
}
