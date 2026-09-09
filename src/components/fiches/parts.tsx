import Link from "next/link";
import { displayName } from "@/lib/format";

/** Fil d'Ariane des pages formation et métier. */
export function Crumbs({ items }: { items: Array<{ href?: string; label: string }> }) {
  return (
    <nav aria-label="Fil d'Ariane" className="text-caption text-navy-300 flex flex-wrap items-center gap-1.5">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden="true">›</span>}
          {it.href ? <Link href={it.href} className="hover:text-white underline-offset-4 hover:underline">{it.label}</Link> : <span className="text-navy-100">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export interface EstRow { slug: string; name: string; city: string; region: { code: string; name: string }; type: { color: string; nameFr: string; nameEn: string } }

/** Liste d'établissements groupée par région, chaque ligne menant à la fiche. */
export function EstablishmentsByRegion({ items, locale }: { items: EstRow[]; locale: string }) {
  const groups = new Map<string, EstRow[]>();
  for (const e of items) { const g = groups.get(e.region.name); if (g) g.push(e); else groups.set(e.region.name, [e]); }
  const ordered = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  return (
    <div className="divide-y divide-navy-100 border border-navy-200 rounded-card overflow-hidden bg-white">
      {ordered.map(([region, list]) => (
        <section key={region}>
          <h3 className="flex justify-between px-4 py-2 bg-navy-50 text-[10px] font-extrabold uppercase tracking-wider text-navy-500">
            <span>{region}</span><span className="tabular-nums">{list.length}</span>
          </h3>
          <ul>
            {list.sort((a, b) => a.name.localeCompare(b.name)).map((e) => (
              <li key={e.slug}>
                <Link href={`/${locale}/etablissement/${e.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-navy-50 transition-colors group">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white shadow" style={{ background: e.type.color }} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-heading font-bold text-[14px] text-navy-900 group-hover:text-electric-600 transition-colors">{displayName(e.name)}</span>
                    <span className="block text-caption text-navy-500">{e.city} · {locale === "fr" ? e.type.nameFr : e.type.nameEn}</span>
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="w-4 h-4 text-navy-300 group-hover:text-navy-900 group-hover:translate-x-0.5 transition-all" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));
