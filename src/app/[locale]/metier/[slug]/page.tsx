import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getMetierPage } from "@/lib/data";
import { getMetierUrls } from "@/lib/metier-urls";
import { Crumbs, EstablishmentsByRegion, fill, type EstRow } from "@/components/fiches/parts";

export const revalidate = 600;

export async function generateMetadata({ params }: { params: { locale: Locale; slug: string } }): Promise<Metadata> {
  const [dict, m] = await Promise.all([getDictionary(params.locale), getMetierPage(params.slug)]);
  if (!m) return {};
  return {
    title: `${m.nameFr} : ${dict.fiches.leadsTo.toLowerCase()}`,
    description: fill(dict.fiches.metaMetier, { name: m.nameFr }),
    alternates: { canonical: `/${params.locale}/metier/${m.slug}` },
  };
}

export default async function MetierPage({ params }: { params: { locale: Locale; slug: string } }) {
  const [dict, m] = await Promise.all([getDictionary(params.locale), getMetierPage(params.slug)]);
  if (!m) notFound();
  const L = params.locale, fr = L === "fr", t = dict.fiches;
  const formations = m.formations.map((x) => x.formation).sort((a, b) => a.level.order - b.level.order || a.nameFr.localeCompare(b.nameFr));
  const establishments = new Map<string, EstRow>();
  for (const f of formations) for (const { establishment: e } of f.establishments) establishments.set(e.slug, e);
  const ests = Array.from(establishments.values());
  const urls = getMetierUrls(m.slug);
  const jsonLd = { "@context": "https://schema.org", "@type": "Occupation", name: m.nameFr, occupationalCategory: m.family, description: fill(t.metaMetier, { name: m.nameFr }) };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="bg-gradient-to-b from-navy-900 to-navy-800 text-white">
        <div className="max-w-content mx-auto px-container py-10 lg:py-14">
          <Crumbs items={[{ href: `/${L}`, label: t.breadcrumbHome }, { href: `/${L}/carte?view=metiers`, label: dict.home.doorJob }, { label: m.nameFr }]} />
          <p className="font-mono text-caption font-bold uppercase tracking-[.16em] text-signal-300 mt-5">{t.metierKicker} · {m.family}</p>
          <h1 className="font-heading text-h1 mt-2 text-balance">{m.nameFr}</h1>
          <p className="text-body-lg text-navy-300 max-w-[64ch] mt-3">
            {formations.length === 1 ? t.formationOne : fill(t.formationsOf, { n: formations.length })} · {ests.length === 1 ? t.verifiedOne : fill(t.verifiedCount, { n: ests.length })}
            {m.level && <> · {t.levelRequired} : {m.level}</>}
          </p>
          <div className="flex flex-wrap gap-2.5 mt-6">
            <Link href={`/${L}/carte?metier=${m.slug}`} className="rounded-button bg-electric-500 hover:bg-electric-600 text-white px-5 py-2.5 font-bold text-body-sm transition-colors">{t.seeOnMap}</Link>
            <a href={urls.futurEnTrain} target="_blank" rel="noopener noreferrer" className="rounded-button border border-white/25 px-5 py-2.5 font-bold text-body-sm hover:border-signal-300 transition-colors">Futur en train</a>
            <a href={urls.avecIndustrie} target="_blank" rel="noopener noreferrer" className="rounded-button border border-white/25 px-5 py-2.5 font-bold text-body-sm hover:border-signal-300 transition-colors">Avec l&apos;industrie ferroviaire</a>
          </div>
        </div>
      </section>

      <section className="max-w-content mx-auto px-container py-10 lg:py-14 w-full grid gap-8 lg:grid-cols-[.6fr_1fr] items-start">
        <div className="space-y-5 lg:sticky lg:top-24">
          <div className="bg-white border border-navy-200 rounded-card p-6">
            <h2 className="font-heading text-h4">{t.leadsTo}</h2>
            {formations.length === 0 ? <p className="text-body-sm text-navy-500 mt-2">{t.noFormation}</p> : (
              <ol className="mt-3 space-y-1.5">
                {formations.map((f) => (
                  <li key={f.slug}>
                    <Link href={`/${L}/formation/${f.slug}`} className="flex items-center gap-2.5 rounded-xl px-3 py-2 -mx-3 hover:bg-navy-50 transition-colors group">
                      <span className="w-8 h-8 rounded-lg grid place-items-center shrink-0 text-white" style={{ background: f.domain.color }} aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" className="w-4 h-4"><path d="M12 3L3 8l9 5 9-5-9-5zM3 13l9 5 9-5M3 18l9 5 9-5" /></svg>
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold text-[14px] text-navy-900 group-hover:text-electric-600 transition-colors leading-snug">{f.nameFr}</span>
                        <span className="block text-caption text-navy-500">{fr ? f.level.nameFr : f.level.nameEn} · {f.establishments.length} {f.establishments.length > 1 ? dict.map.establishmentMany : dict.map.establishmentOne}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>
          {m.related.length > 0 && (
            <div className="bg-white border border-navy-200 rounded-card p-6">
              <h2 className="font-heading text-h4">{t.relatedJobs}</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {m.related.map((r) => <li key={r.slug}><Link href={`/${L}/metier/${r.slug}`} className="chip">{r.nameFr}</Link></li>)}
              </ul>
            </div>
          )}
        </div>
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <h2 className="font-heading text-h3">{t.whereJobs}</h2>
            <Link href={`/${L}/carte?metier=${m.slug}`} className="text-caption font-bold border-b-2 border-signal-300">{t.moreOnMap}</Link>
          </div>
          {ests.length > 0 ? <EstablishmentsByRegion items={ests} locale={L} /> : (
            <div className="bg-white border border-navy-200 rounded-card p-6 text-navy-600">
              {t.noEstablishment} <Link href={`/${L}/contact?sujet=nouveau`} className="font-bold underline text-navy-900">{t.propose}</Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
