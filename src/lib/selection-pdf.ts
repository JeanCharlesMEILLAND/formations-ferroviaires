import { PdfDoc, PAGE, wrap, textWidth } from "./pdf";
import { displayName } from "./format";
import type { SelectionItem } from "./selection-data";

const M = 40, CW = PAGE.w - 2 * M;
const INK: [number, number, number] = [0.05, 0.12, 0.17];
const GREY: [number, number, number] = [0.42, 0.49, 0.53];
const LINK: [number, number, number] = [0.1, 0.33, 0.62];
const CORAL: [number, number, number] = [1, 0.35, 0.21];
const ZEBRA: [number, number, number] = [0.955, 0.965, 0.965];

const T = {
  fr: { title: "Ma sélection d'établissements", site: "Formations ferroviaires", generated: (d: string) => `Liste établie le ${d}`, overview: "Vue d'ensemble", details: "Détail par établissement", cols: ["Établissement", "Ville", "Type", "Niveaux", "Form.", "Site web"], formations: "Formations", metiers: "Métiers visés", more: (n: number) => `… et ${n} autres`, none: "Aucune formation renseignée", page: (i: number, n: number) => `page ${i} sur ${n}`, fiche: "Fiche en ligne", est: (n: number) => `${n} établissement${n > 1 ? "s" : ""}` },
  en: { title: "My shortlist of institutions", site: "Formations ferroviaires", generated: (d: string) => `List drawn up on ${d}`, overview: "Overview", details: "Details per institution", cols: ["Institution", "City", "Type", "Levels", "Prog.", "Website"], formations: "Programs", metiers: "Target professions", more: (n: number) => `… and ${n} more`, none: "No program recorded", page: (i: number, n: number) => `page ${i} of ${n}`, fiche: "Online listing", est: (n: number) => `${n} institution${n > 1 ? "s" : ""}` },
};

const host = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "");

/** Liste à emporter : tableau récapitulatif puis détail par établissement, pieds de page numérotés. */
export function buildSelectionPdf(items: SelectionItem[], locale: "fr" | "en", base: string): Buffer {
  const t = T[locale];
  const fr = locale === "fr";
  const doc = new PdfDoc();
  let y = 0;
  const newPage = () => { doc.addPage(); y = PAGE.h - M; };
  const ensure = (h: number) => { if (y - h < M + 24) newPage(); };
  newPage();

  // En-tête
  doc.text(M, y - 14, t.title, 20, { bold: true });
  y -= 30;
  const date = new Intl.DateTimeFormat(fr ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
  doc.text(M, y, `${t.generated(date)} · ${t.est(items.length)} · ${host(base)}`, 9.5, { color: GREY });
  y -= 10;
  doc.rect(M, y, 60, 3, CORAL);
  y -= 22;

  // Tableau récapitulatif
  const widths = [140, 72, 80, 112, 34, CW - 438];
  const xs = widths.reduce<number[]>((acc, w, i) => [...acc, i === 0 ? M : acc[i - 1] + widths[i - 1]], []);
  const header = () => {
    doc.text(M, y, t.overview, 12, { bold: true }); y -= 16;
    t.cols.forEach((c, i) => doc.text(xs[i] + 4, y, c.toUpperCase(), 7.5, { bold: true, color: GREY }));
    y -= 6; doc.line(M, y, M + CW, y, 0.8, [0.72, 0.78, 0.81]); y -= 4;
  };
  header();
  items.forEach((e, idx) => {
    const levels = Array.from(new Map(e.formations.map((f) => [f.formation.level.slug, f.formation.level])).values()).sort((a, b) => a.order - b.order).map((l) => (fr ? l.nameFr : l.nameEn).replace(/\s*\(.*\)$/, ""));
    const cells = [displayName(e.name), e.city, fr ? e.type.nameFr : e.type.nameEn, levels.join(", ") || "–", String(e.formations.length), e.website ? host(e.website) : "–"];
    const lines = cells.map((c, i) => wrap(c, widths[i] - 8, 8.5, i === 0));
    const rowH = Math.max(...lines.map((l) => l.length)) * 10.5 + 8;
    if (y - rowH < M + 24) { newPage(); header(); }
    if (idx % 2 === 0) doc.rect(M, y - rowH + 4, CW, rowH, ZEBRA);
    lines.forEach((ls, i) => ls.forEach((l, k) => doc.text(xs[i] + 4, y - 8 - k * 10.5, l, 8.5, { bold: i === 0, color: i === 5 && e.website ? LINK : INK })));
    if (e.website) doc.link(xs[5], y - rowH + 4, widths[5], rowH, e.website);
    doc.link(xs[0], y - rowH + 4, widths[0], rowH, `${base}/${locale}/etablissement/${e.slug}`);
    y -= rowH;
    doc.line(M, y + 2, M + CW, y + 2, 0.4);
  });
  y -= 22;

  // Détail
  ensure(40);
  doc.text(M, y, t.details, 12, { bold: true }); y -= 20;
  for (const e of items) {
    const formations = [...e.formations].sort((a, b) => a.formation.level.order - b.formation.level.order || a.formation.nameFr.localeCompare(b.formation.nameFr));
    ensure(70);
    doc.rect(M, y - 2, 3, 14, CORAL);
    const nameLines = wrap(displayName(e.name), CW - 12, 13, true);
    nameLines.forEach((l, k) => doc.text(M + 10, y - k * 15, l, 13, { bold: true }));
    y -= nameLines.length * 15;
    const place = e.address && !e.address.toLowerCase().includes(e.city.toLowerCase()) ? `${e.address}, ${e.city}` : e.address || e.city;
    const meta = [fr ? e.type.nameFr : e.type.nameEn, place, e.region.name].join(" · ");
    wrap(meta, CW - 12, 9).forEach((l) => { doc.text(M + 10, y, l, 9, { color: GREY }); y -= 11.5; });
    const fiche = `${base}/${locale}/etablissement/${e.slug}`;
    const links: Array<[string, string]> = [[t.fiche, fiche]];
    if (e.website) links.push([host(e.website), e.website]);
    let x = M + 10;
    for (const [label, url] of links) {
      const w = textWidth(label, 9);
      doc.text(x, y, label, 9, { color: LINK }); doc.link(x, y - 2, w, 11, url);
      x += w + 14;
    }
    y -= 15;
    doc.text(M + 10, y, `${t.formations} (${formations.length})`, 9, { bold: true }); y -= 12;
    if (formations.length === 0) { doc.text(M + 18, y, t.none, 9, { color: GREY }); y -= 12; }
    const shown = formations.slice(0, 30);
    for (const { formation: f } of shown) {
      const lines = wrap(`• ${f.nameFr} — ${fr ? f.level.nameFr : f.level.nameEn}`, CW - 24, 9);
      ensure(lines.length * 11.5 + 4);
      lines.forEach((l, k) => doc.text(M + 18 + (k ? 8 : 0), y, l, 9)); y -= lines.length * 11.5;
      if (lines.length > 1) y -= 0; 
    }
    if (formations.length > shown.length) { doc.text(M + 18, y, t.more(formations.length - shown.length), 9, { color: GREY }); y -= 12; }
    const metiers = Array.from(new Map(formations.flatMap((f) => f.formation.metiers.map((m) => [m.metier.slug, m.metier.nameFr]))).values()).sort();
    if (metiers.length) {
      y -= 3;
      const lines = wrap(`${t.metiers} : ${metiers.join(", ")}`, CW - 12, 9);
      ensure(lines.length * 11.5);
      lines.forEach((l) => { doc.text(M + 10, y, l, 9, { color: GREY }); y -= 11.5; });
    }
    y -= 16;
  }

  // Pieds de page
  const n = doc.pageCount;
  for (let i = 0; i < n; i++) {
    doc.text(M, 28, `${t.site} · ${base.replace(/^https?:\/\//, "")}`, 8, { color: GREY, pageIndex: i });
    const p = t.page(i + 1, n);
    doc.text(PAGE.w - M - textWidth(p, 8), 28, p, 8, { color: GREY, pageIndex: i });
  }
  return doc.build();
}
