"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { displayName } from "@/lib/format";
import { readSelection, useSelection } from "@/lib/selection";
import type { SelectionItem } from "@/lib/selection-data";

const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

/** Comparateur : colonnes = établissements, lignes = critères puis grille des formations. Pilote la sélection locale. */
export default function CompareTable({ items, locale, dict, fromUrl }: { items: SelectionItem[]; locale: Locale; dict: Dictionary; fromUrl: string[] }) {
  const router = useRouter();
  const sel = useSelection();
  const t = dict.selection;
  const fr = locale === "fr";
  const [checked, setChecked] = useState(fromUrl.length > 0);
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (fromUrl.length > 0) setChecked(true); }, [fromUrl.length]);

  // Sans « s » dans l'adresse : on reprend la sélection du navigateur ; avec : on la mémorise si le navigateur n'en avait pas.
  useEffect(() => {
    const local = readSelection();
    if (fromUrl.length === 0) {
      if (local.length > 0) router.replace(`/${locale}/selection?s=${local.join(",")}`);
      else setChecked(true);
    } else if (local.length === 0) sel.replace(fromUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = useMemo(() => items.filter((e) => fromUrl.length === 0 || fromUrl.includes(e.slug)), [items, fromUrl]);
  const slugs = shown.map((e) => e.slug);
  const remove = (slug: string) => {
    sel.remove(slug);
    const rest = slugs.filter((s) => s !== slug);
    router.replace(rest.length ? `/${locale}/selection?s=${rest.join(",")}` : `/${locale}/selection`);
  };
  const clear = () => { sel.clear(); router.replace(`/${locale}/selection`); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* presse-papiers indisponible */ }
  };

  if (!checked) return <p className="text-navy-500 py-10 text-center">{t.loading}</p>;
  if (shown.length === 0) {
    return (
      <div className="bg-white border border-navy-200 rounded-card p-10 text-center">
        <p className="font-heading text-h3">{t.empty}</p>
        <p className="text-navy-500 mt-2 max-w-[48ch] mx-auto">{t.emptyHint}</p>
        <Link href={`/${locale}/carte`} className="inline-block mt-6 rounded-button bg-electric-500 hover:bg-electric-600 text-white px-6 py-3 font-bold text-body-sm">{t.goMap}</Link>
      </div>
    );
  }

  const levelsOf = (e: SelectionItem) => Array.from(new Map(e.formations.map((f) => [f.formation.level.slug, f.formation.level])).values()).sort((a, b) => a.order - b.order);
  const domainsOf = (e: SelectionItem) => Array.from(new Map(e.formations.map((f) => [f.formation.domain.slug, f.formation.domain])).values());
  const metiersOf = (e: SelectionItem) => Array.from(new Map(e.formations.flatMap((f) => f.formation.metiers.map((m) => [m.metier.slug, m.metier]))).values()).sort((a, b) => a.nameFr.localeCompare(b.nameFr));
  const allFormations = Array.from(new Map(shown.flatMap((e) => e.formations.map((f) => [f.formation.slug, f.formation]))).values()).sort((a, b) => a.level.order - b.level.order || a.nameFr.localeCompare(b.nameFr));
  const hasF = (e: SelectionItem, slug: string) => e.formations.some((f) => f.formation.slug === slug);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5 mb-5">
        <a href={`/api/selection/pdf?s=${slugs.join(",")}&locale=${locale}`} className="inline-flex items-center gap-2 rounded-button bg-electric-500 hover:bg-electric-600 text-white px-5 py-2.5 font-bold text-body-sm transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
          {t.pdf}
        </a>
        <button type="button" onClick={copy} className="chip">{copied ? `✓ ${t.copied}` : t.copy}</button>
        <Link href={`/${locale}/carte`} className="chip">{t.goMap}</Link>
        <button type="button" onClick={clear} className="chip chip-danger ml-auto">{t.clear}</button>
      </div>

      <div className="compare-wrap">
        <table className="compare">
          <thead>
            <tr>
              <th scope="col" className="compare-label">{shown.length === 1 ? t.countOne : fill(t.count, { n: shown.length })}</th>
              {shown.map((e) => (
                <th key={e.slug} scope="col">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/${locale}/etablissement/${e.slug}`} className="font-heading font-bold text-[14px] leading-snug text-navy-900 hover:text-electric-600 transition-colors">{displayName(e.name)}</Link>
                    <button type="button" onClick={() => remove(e.slug)} className="w-7 h-7 rounded-full grid place-items-center text-navy-400 hover:bg-navy-100 hover:text-navy-900 shrink-0" aria-label={`${t.remove} : ${displayName(e.name)}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="w-3.5 h-3.5" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                  </div>
                  <span className="block text-caption font-normal text-navy-500 mt-1">{e.city}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr><th scope="row" className="compare-label">{t.rows.type}</th>{shown.map((e) => <td key={e.slug}><span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ background: e.type.color }}>{fr ? e.type.nameFr : e.type.nameEn}</span></td>)}</tr>
            <tr><th scope="row" className="compare-label">{t.rows.place}</th>{shown.map((e) => <td key={e.slug}>{e.city} · {e.region.name}</td>)}</tr>
            <tr><th scope="row" className="compare-label">{t.rows.count}</th>{shown.map((e) => <td key={e.slug} className="font-heading font-extrabold text-[20px] tabular-nums">{e.formations.length}</td>)}</tr>
            <tr><th scope="row" className="compare-label">{t.rows.levels}</th>{shown.map((e) => <td key={e.slug}><span className="flex flex-wrap gap-1">{levelsOf(e).map((l) => <span key={l.slug} className="chip chip-sm">{(fr ? l.nameFr : l.nameEn).replace(/\s*\(.*\)$/, "")}</span>)}{levelsOf(e).length === 0 && "–"}</span></td>)}</tr>
            <tr><th scope="row" className="compare-label">{t.rows.domains}</th>{shown.map((e) => <td key={e.slug}><ul className="space-y-1">{domainsOf(e).map((d) => <li key={d.slug} className="flex items-center gap-1.5 text-caption"><i className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />{fr ? d.nameFr : d.nameEn}</li>)}</ul></td>)}</tr>
            <tr><th scope="row" className="compare-label">{t.rows.metiers}</th>{shown.map((e) => { const ms = metiersOf(e); return <td key={e.slug}><span className="font-bold">{ms.length}</span>{ms.length > 0 && <span className="block text-caption text-navy-500 mt-1">{ms.slice(0, 5).map((m) => m.nameFr).join(", ")}{ms.length > 5 ? ` +${ms.length - 5}` : ""}</span>}</td>; })}</tr>
            <tr><th scope="row" className="compare-label">{t.rows.website}</th>{shown.map((e) => <td key={e.slug}>{e.website ? <a href={e.website} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 break-all">{e.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "")}</a> : "–"}</td>)}</tr>
            <tr><th scope="row" className="compare-label">{t.rows.fiche}</th>{shown.map((e) => <td key={e.slug}><span className="flex flex-wrap gap-1.5"><Link href={`/${locale}/etablissement/${e.slug}`} className="chip chip-sm is-on">{t.rows.fiche}</Link><Link href={`/${locale}/carte?etablissement=${e.slug}`} className="chip chip-sm">{t.rows.map}</Link></span></td>)}</tr>
            <tr className="compare-section"><th scope="rowgroup" colSpan={shown.length + 1}>{t.matrix} <span className="text-navy-400 font-semibold">· {allFormations.length}</span></th></tr>
            {allFormations.map((f) => {
              const all = shown.every((e) => hasF(e, f.slug));
              return (
                <tr key={f.slug} className={all ? "is-common" : ""}>
                  <th scope="row" className="compare-label">
                    <Link href={`/${locale}/formation/${f.slug}`} className="hover:text-electric-600 transition-colors">{f.nameFr}</Link>
                    <span className="block text-[10px] font-semibold text-navy-400 mt-0.5">{(fr ? f.level.nameFr : f.level.nameEn).replace(/\s*\(.*\)$/, "")}{all && shown.length > 1 ? ` · ${t.allHave}` : ""}</span>
                  </th>
                  {shown.map((e) => <td key={e.slug} className="text-center">{hasF(e, f.slug) ? <span className="compare-yes" aria-label="oui">✓</span> : <span className="text-navy-300" aria-label="non">–</span>}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
