import { PdfDoc, PAGE, type RGB } from "./pdf";
import type { EmbeddedFont, PdfFontKey } from "./pdf-fonts";
import { displayName } from "./format";
import type { SelectionItem } from "./selection-data";

const M = 40, CW = PAGE.w - 2 * M;
const INK: RGB = [0.05, 0.12, 0.17];      // bleu pétrole
const NAVY800: RGB = [0.07, 0.19, 0.25];
const GREY: RGB = [0.42, 0.49, 0.53];
const NAVY300: RGB = [0.72, 0.78, 0.81];
const NAVY100: RGB = [0.89, 0.93, 0.94];
const NAVY50: RGB = [0.95, 0.95, 0.95];
const SIGNAL: RGB = [1, 0.85, 0.3];        // jaune signal
const CORAL: RGB = [1, 0.35, 0.21];        // corail balise
const ECO: RGB = [0.11, 0.55, 0.43];       // vert rail
const ECO50: RGB = [0.87, 0.95, 0.92];
const SIGNAL50: RGB = [1, 0.97, 0.84];
const SIGNAL800: RGB = [0.5, 0.37, 0.02];

const T = {
  fr: { kicker: "FORMATIONS FERROVIAIRES · LE GUIDE DES MÉTIERS DU RAIL", title: "Ma sélection d'établissements", listTitle: "Liste d'établissements", byRegion: "Établissements par région", generated: (d: string) => `Liste établie le ${d}`, overview: "Vue d'ensemble", details: "Détail par établissement", cols: ["Établissement", "Ville", "Type", "Niveaux", "Form.", "Site web"], formations: "Formations", metiers: "Métiers visés", more: (n: number) => `… et ${n} autres`, none: "Aucune formation renseignée", page: (i: number, n: number) => `page ${i} sur ${n}`, fiche: "Fiche en ligne", est: (n: number) => `${n} établissement${n > 1 ? "s" : ""}`, verified: "Vérifié", generalist: "Généraliste", footer: "Chaque fiche renvoie à la source officielle · les établissements « vérifiés » ont été relus par l'équipe" },
  en: { kicker: "FORMATIONS FERROVIAIRES · THE RAIL CAREERS GUIDE", title: "My shortlist of institutions", listTitle: "List of institutions", byRegion: "Institutions by region", generated: (d: string) => `List drawn up on ${d}`, overview: "Overview", details: "Details per institution", cols: ["Institution", "City", "Type", "Levels", "Prog.", "Website"], formations: "Programs", metiers: "Target professions", more: (n: number) => `… and ${n} more`, none: "No program recorded", page: (i: number, n: number) => `page ${i} of ${n}`, fiche: "Online listing", est: (n: number) => `${n} institution${n > 1 ? "s" : ""}`, verified: "Verified", generalist: "Generalist", footer: "Each listing links to the official source · “verified” institutions were reviewed by the team" },
};

const host = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "");
const hex = (h: string): RGB => { const m = /^#?([0-9a-f]{6})$/i.exec(h.trim()); if (!m) return GREY; const n = parseInt(m[1], 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const shortLevel = (s: string) => s.replace(/\s*\(.*\)$/, "");

/** Liste à emporter à la charte du site : bandeau pétrole, rail jaune, tableau, cartes par établissement. */
export interface PdfOptions {
  /** « selection » : tableau puis détail par établissement ; « list » : tableau compact groupé par région. */
  mode?: "selection" | "list";
  title?: string;
  subtitle?: string;
}

export function buildSelectionPdf(items: SelectionItem[], locale: "fr" | "en", base: string, fonts: Partial<Record<PdfFontKey, EmbeddedFont>> = {}, options: PdfOptions = {}): Buffer {
  const t = T[locale];
  const fr = locale === "fr";
  const mode = options.mode ?? "selection";
  const doc = new PdfDoc(fonts);
  let y = 0;

  const rail = (yy: number, dash = 22, gap = 10, h = 4) => { for (let x = M; x < M + CW; x += dash + gap) doc.rect(x, yy, Math.min(dash, M + CW - x), h, SIGNAL); };
  const pill = (x: number, yy: number, label: string, fill: RGB, color: RGB, size = 7): number => {
    const w = doc.width(label.toUpperCase(), size, "bold", 0.4) + 12;
    doc.roundRect(x, yy - 4, w, size + 8, (size + 8) / 2, fill);
    doc.text(x + 6, yy, label.toUpperCase(), size, { font: "bold", color, charSpacing: 0.4 });
    return w;
  };
  const newPage = () => { doc.addPage(); y = PAGE.h - M; };
  const ensure = (h: number) => { if (y - h < M + 30) newPage(); };
  const section = (title: string) => { ensure(48); doc.text(M, y - 8, title, 14, { font: "heading" }); doc.rect(M, y - 16, 34, 2.5, CORAL); y -= 34; };

  // ---- Bandeau de couverture
  newPage();
  const BAND = 126;
  doc.rect(0, PAGE.h - BAND, PAGE.w, BAND, INK);
  doc.rect(0, PAGE.h - BAND, PAGE.w, 46, NAVY800);
  doc.roundRect(M, PAGE.h - 36, 26, 26, 6, SIGNAL);
  doc.text(M + 5.5, PAGE.h - 28, "FF", 11, { font: "heading", color: INK });
  doc.text(M + 36, PAGE.h - 22, "Formations ferroviaires", 12, { font: "heading", color: [1, 1, 1] });
  doc.text(M + 36, PAGE.h - 34, t.kicker, 6.5, { font: "bold", color: SIGNAL, charSpacing: 0.9 });
  const mainTitle = mode === "list" ? options.title || t.listTitle : t.title;
  const titleSize = doc.width(mainTitle, 24, "heading") > CW ? 17 : 24;
  doc.text(M, PAGE.h - 84, mainTitle, titleSize, { font: "heading", color: [1, 1, 1] });
  const date = new Intl.DateTimeFormat(fr ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
  const sub = mode === "list" && options.subtitle ? `${options.subtitle} · ` : "";
  doc.text(M, PAGE.h - 106, `${sub}${t.generated(date)} · ${t.est(items.length)} · ${host(base)}`, 9.5, { color: NAVY300 });
  rail(PAGE.h - BAND - 6);
  y = PAGE.h - BAND - 34;

  // ---- Vue d'ensemble (ou liste groupée par région)
  section(mode === "list" ? t.byRegion : t.overview);
  const ordered = mode === "list" ? [...items].sort((a, b) => a.region.name.localeCompare(b.region.name) || a.name.localeCompare(b.name)) : items;
  let currentRegion = "";
  const widths = [140, 70, 82, 116, 32, CW - 440];
  const xs = widths.reduce<number[]>((acc, _, i) => [...acc, i === 0 ? M : acc[i - 1] + widths[i - 1]], []);
  const header = () => {
    doc.roundRect(M, y - 14, CW, 20, 5, NAVY100);
    t.cols.forEach((c, i) => doc.text(xs[i] + 6, y - 8, c.toUpperCase(), 6.8, { font: "bold", color: GREY, charSpacing: 0.6 }));
    y -= 22;
  };
  header();
  ordered.forEach((e, idx) => {
    if (mode === "list" && e.region.name !== currentRegion) {
      currentRegion = e.region.name;
      if (y - 22 < M + 30) { newPage(); header(); }
      doc.text(M + 6, y - 7, currentRegion.toUpperCase(), 7, { font: "bold", color: INK, charSpacing: 0.7 });
      doc.line(M, y - 12, M + CW, y - 12, 0.6, SIGNAL);
      y -= 18;
    }
    const levels = Array.from(new Map(e.formations.map((f) => [f.formation.level.slug, f.formation.level])).values()).sort((a, b) => a.order - b.order).map((l) => shortLevel(fr ? l.nameFr : l.nameEn));
    const cells = [displayName(e.name), e.city, "", levels.join(", ") || "–", String(e.formations.length), e.website ? host(e.website) : "–"];
    const fontOf = (i: number): PdfFontKey => (i === 0 ? "bold" : "regular");
    const lines = cells.map((c, i) => doc.wrap(c, widths[i] - 10, 8.5, fontOf(i)));
    const typeLines = doc.wrap(fr ? e.type.nameFr : e.type.nameEn, widths[2] - 10, 7.5, "bold");
    const rowLines = Math.max(...lines.map((l) => l.length), typeLines.length);
    const rowH = rowLines * 10.5 + 9;
    if (y - rowH < M + 30) { newPage(); header(); }
    if (idx % 2 === 0) doc.roundRect(M, y - rowH + 5, CW, rowH, 4, NAVY50);
    lines.forEach((ls, i) => { if (i === 2) return; ls.forEach((l, k) => doc.text(xs[i] + 6, y - 8 - k * 10.5, l, 8.5, { font: fontOf(i), color: i === 5 && e.website ? NAVY800 : INK })); });
    typeLines.forEach((l, k) => doc.text(xs[2] + 6, y - 8 - k * 10.5, l, 7.5, { font: "bold", color: hex(e.type.color) }));
    if (e.website) doc.link(xs[5], y - rowH + 5, widths[5], rowH, e.website);
    doc.link(xs[0], y - rowH + 5, widths[0], rowH, `${base}/${locale}/etablissement/${e.slug}`);
    y -= rowH;
  });
  y -= 18;

  // ---- Détail (sélection seulement)
  const detailed = mode === "list" ? [] : items;
  if (detailed.length) section(t.details);
  for (const e of detailed) {
    const formations = [...e.formations].sort((a, b) => a.formation.level.order - b.formation.level.order || a.formation.nameFr.localeCompare(b.formation.nameFr));
    ensure(84);
    const typeColor = hex(e.type.color);
    doc.rect(M, y - 26, 4, 30, typeColor);
    const nameLines = doc.wrap(displayName(e.name), CW - 14, 13.5, "heading");
    nameLines.forEach((l, k) => doc.text(M + 12, y - 2 - k * 16, l, 13.5, { font: "heading" }));
    y -= nameLines.length * 16 + 4;
    let px = M + 12;
    px += pill(px, y - 3, fr ? e.type.nameFr : e.type.nameEn, typeColor, [1, 1, 1]) + 5;
    if (e.source !== "api") pill(px, y - 3, t.verified, ECO50, ECO); else pill(px, y - 3, t.generalist, SIGNAL50, SIGNAL800);
    y -= 17;
    const place = e.address && !e.address.toLowerCase().includes(e.city.toLowerCase()) ? `${e.address}, ${e.city}` : e.address || e.city;
    doc.wrap(`${place} · ${e.region.name}`, CW - 14, 9).forEach((l) => { doc.text(M + 12, y, l, 9, { color: GREY }); y -= 11.5; });
    const links: Array<[string, string]> = [[t.fiche, `${base}/${locale}/etablissement/${e.slug}`]];
    if (e.website) links.push([host(e.website), e.website]);
    let lx = M + 12;
    for (const [label, url] of links) {
      const w = doc.width(label, 9, "bold");
      doc.text(lx, y, label, 9, { font: "bold", color: NAVY800 });
      doc.line(lx, y - 1.8, lx + w, y - 1.8, 0.8, SIGNAL);
      doc.link(lx, y - 3, w, 12, url);
      lx += w + 16;
    }
    y -= 17;
    doc.text(M + 12, y, `${t.formations} · ${formations.length}`, 7.5, { font: "bold", color: GREY, charSpacing: 0.6 });
    y -= 12;
    if (formations.length === 0) { doc.text(M + 20, y, t.none, 9, { color: GREY }); y -= 12; }
    const shown = formations.slice(0, 30);
    for (const { formation: f } of shown) {
      const level = shortLevel(fr ? f.level.nameFr : f.level.nameEn);
      const lines = doc.wrap(f.nameFr, CW - 150, 9);
      ensure(lines.length * 11.5 + 3);
      doc.rect(M + 14, y + 2.5, 3.5, 3.5, hex(f.domain.color));
      lines.forEach((l, k) => doc.text(M + 22, y - k * 11.5, l, 9));
      doc.text(M + CW - 118, y, level, 8, { color: GREY });
      y -= lines.length * 11.5 + 1;
    }
    if (formations.length > shown.length) { doc.text(M + 22, y, t.more(formations.length - shown.length), 9, { color: GREY }); y -= 12; }
    const metiers = Array.from(new Map(formations.flatMap((f) => f.formation.metiers.map((m) => [m.metier.slug, m.metier.nameFr]))).values()).sort();
    if (metiers.length) {
      y -= 4;
      const lines = doc.wrap(`${t.metiers} : ${metiers.join(", ")}`, CW - 14, 8.5);
      ensure(lines.length * 11);
      lines.forEach((l) => { doc.text(M + 12, y, l, 8.5, { color: GREY }); y -= 11; });
    }
    y -= 14;
    doc.line(M, y + 6, M + CW, y + 6, 0.5, NAVY100);
    y -= 10;
  }

  // ---- Pieds de page
  const n = doc.pageCount;
  for (let i = 0; i < n; i++) {
    const foot = (s: string, x: number, opts: Parameters<PdfDoc["text"]>[4]) => doc.text(x, 26, s, 7.5, { ...opts, pageIndex: i });
    foot(`${t.footer}`, M, { color: GREY });
    const p = t.page(i + 1, n);
    foot(p, PAGE.w - M - doc.width(p, 7.5, "bold"), { font: "bold", color: INK });
  }
  return doc.build();
}
