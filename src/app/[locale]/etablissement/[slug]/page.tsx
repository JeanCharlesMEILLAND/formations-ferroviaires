import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getEstablishmentBySlug } from "@/lib/data";
import { displayName } from "@/lib/format";
import { Crumbs } from "@/components/fiches/parts";
import MiniMap from "@/components/fiches/MiniMap";

export const revalidate = 600;

export async function generateMetadata({ params }: { params: { locale: Locale; slug: string } }): Promise<Metadata> {
  const [dict, e] = await Promise.all([getDictionary(params.locale), getEstablishmentBySlug(params.slug)]);
  if (!e) return {};
  const name = displayName(e.name);
  return {
    title: `${name}, ${e.city}`,
    description: `${name} (${params.locale === "fr" ? e.type.nameFr : e.type.nameEn}, ${e.city}) : ${e.formations.length} ${e.formations.length > 1 ? dict.map.formations : dict.map.formation} ${dict.meta.tagline.toLowerCase()}.`,
    alternates: { canonical: `/${params.locale}/etablissement/${e.slug}` },
  };
}

export default async function EstablishmentPage({ params }: { params: { locale: Locale; slug: string } }) {
  const [dict, e] = await Promise.all([getDictionary(params.locale), getEstablishmentBySlug(params.slug)]);
  if (!e) notFound();
  const L = params.locale, fr = L === "fr", t = dict.establishment;
  const name = displayName(e.name);
  const verified = e.source !== "api";
  const formations = [...e.formations].sort((a, b) => a.formation.level.order - b.formation.level.order || a.formation.nameFr.localeCompare(b.formation.nameFr));
  const byLevel = new Map<string, typeof formations>();
  for (const ef of formations) { const k = fr ? ef.formation.level.nameFr : ef.formation.level.nameEn; const g = byLevel.get(k); if (g) g.push(ef); else byLevel.set(k, [ef]); }
  const metiers = new Map<string, { slug: string; nameFr: string; family: string }>();
  for (const ef of formations) for (const mf of ef.formation.metiers) metiers.set(mf.metier.slug, mf.metier);
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${e.lat},${e.lng}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name,
    url: e.website || undefined,
    sameAs: e.onisepUrl || undefined,
    address: { "@type": "PostalAddress", streetAddress: e.address || undefined, addressLocality: e.city, addressRegion: e.region.name, addressCountry: "FR" },
    geo: { "@type": "GeoCoordinates", latitude: e.lat, longitude: e.lng },
  };
  const btn = "inline-flex items-center gap-2 rounded-button px-4 py-2.5 text-body-sm font-bold transition-colors";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="bg-gradient-to-b from-navy-900 to-navy-800 text-white">
        <div className="max-w-content mx-auto px-container py-10 lg:py-14">
          <Crumbs items={[{ href: `/${L}`, label: dict.fiches.breadcrumbHome }, { href: `/${L}/carte?region=${e.region.code}`, label: e.region.name }, { label: name }]} />
          <div className="flex flex-wrap items-center gap-2 mt-5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white" style={{ background: e.type.color }}>{fr ? e.type.nameFr : e.type.nameEn}</span>
            {verified ? (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-eco-500/20 text-eco-200 border border-eco-400/40">✓ {dict.map.verifiedBadge}</span>
            ) : (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-signal-300/15 text-signal-200 border border-signal-300/40">{dict.map.generalistBadge}</span>
            )}
          </div>
          <h1 className="font-heading text-h1 mt-3 text-balance">{name}</h1>
          <p className="text-body-lg text-navy-300 mt-2">{e.address ? `${e.address}, ` : ""}{e.city} · {e.region.name}</p>
          <div className="flex flex-wrap gap-2.5 mt-6">
            <Link href={`/${L}/contact?sujet=fiche&etablissement=${e.slug}`} className={`${btn} bg-signal-300 text-navy-900 hover:bg-signal-200`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
              {t.updateThis}
            </Link>
            <Link href={`/${L}/carte?etablissement=${e.slug}`} className={`${btn} bg-electric-500 text-white hover:bg-electric-600`}>{dict.fiches.seeOnMap}</Link>
            {e.website && <a href={e.website} target="_blank" rel="noopener noreferrer" className={`${btn} border border-white/25 hover:border-signal-300`}>{t.website} ↗</a>}
            {e.onisepUrl && <a href={e.onisepUrl} target="_blank" rel="noopener noreferrer" className={`${btn} border border-white/25 hover:border-signal-300`}>ONISEP ↗</a>}
            <a href={directions} target="_blank" rel="noopener noreferrer" className={`${btn} border border-white/25 hover:border-signal-300`}>{dict.map.directions} ↗</a>
          </div>
        </div>
      </section>

      <section className="max-w-content mx-auto px-container py-10 lg:py-14 w-full grid gap-8 lg:grid-cols-[1fr_.55fr] items-start">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <h2 className="font-heading text-h3">{t.formations}</h2>
            <p className="text-caption text-navy-500">{formations.length} {formations.length > 1 ? dict.map.formations : dict.map.formation}</p>
          </div>
          {formations.length === 0 ? (
            <div className="bg-white border border-navy-200 rounded-card p-6 text-navy-600">{dict.fiches.noFormation}</div>
          ) : (
            <div className="space-y-6">
              {Array.from(byLevel.entries()).map(([level, list]) => (
                <section key={level}>
                  <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-navy-500 mb-2">{level} <span className="text-navy-300">· {list.length}</span></h3>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {list.map(({ formation: f }) => (
                      <li key={f.id} className="bg-white border border-navy-200 rounded-card p-4 flex flex-col gap-2.5 hover:border-navy-900 transition-colors">
                        <div className="flex items-start gap-3">
                          <span className="w-9 h-9 rounded-lg grid place-items-center shrink-0 text-white" style={{ background: f.domain.color }} aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" className="w-4 h-4"><path d="M12 3L3 8l9 5 9-5-9-5zM3 13l9 5 9-5M3 18l9 5 9-5" /></svg>
                          </span>
                          <div className="min-w-0">
                            <Link href={`/${L}/formation/${f.slug}`} className="font-heading font-bold text-[15px] leading-snug text-navy-900 hover:text-electric-600 transition-colors">{f.nameFr}</Link>
                            <p className="text-caption text-navy-500 mt-0.5">{fr ? f.domain.nameFr : f.domain.nameEn}{f.rncpCode && <span className="font-mono"> · RNCP {f.rncpCode}</span>}</p>
                          </div>
                        </div>
                        {f.metiers.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {f.metiers.slice(0, 4).map((mf) => <Link key={mf.metier.slug} href={`/${L}/metier/${mf.metier.slug}`} className="chip chip-sm">{mf.metier.nameFr}</Link>)}
                            {f.metiers.length > 4 && <span className="text-[11px] text-navy-400 self-center">+{f.metiers.length - 4}</span>}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
        <aside className="space-y-5 lg:sticky lg:top-24">
          <MiniMap lat={e.lat} lng={e.lng} color={e.type.color} label={`${name}, ${e.city}`} />
          <div className="bg-white border border-navy-200 rounded-card p-6 text-body-sm">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <dt className="text-navy-500 font-semibold">{t.type}</dt><dd className="text-navy-900 font-bold">{fr ? e.type.nameFr : e.type.nameEn}</dd>
              <dt className="text-navy-500 font-semibold">{t.address}</dt><dd className="text-navy-900">{e.address ? `${e.address}, ` : ""}{e.city}</dd>
              <dt className="text-navy-500 font-semibold">{t.region}</dt><dd><Link href={`/${L}/carte?region=${e.region.code}`} className="text-navy-900 underline underline-offset-2">{e.region.name}</Link></dd>
              {e.website && (<><dt className="text-navy-500 font-semibold">{t.website}</dt><dd className="truncate"><a href={e.website} target="_blank" rel="noopener noreferrer" className="text-navy-900 underline underline-offset-2">{e.website.replace(/^https?:\/\/(www\.)?/, "")}</a></dd></>)}
            </dl>
          </div>
          {metiers.size > 0 && (
            <div className="bg-white border border-navy-200 rounded-card p-6">
              <h2 className="font-heading text-h4">{dict.fiches.targetJobs}</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {Array.from(metiers.values()).sort((a, b) => a.nameFr.localeCompare(b.nameFr)).map((m) => <li key={m.slug}><Link href={`/${L}/metier/${m.slug}`} className="chip">{m.nameFr}</Link></li>)}
              </ul>
            </div>
          )}
          <div className="bg-navy-900 text-white rounded-card p-6">
            <p className="font-heading text-h4">{dict.home.ctaTitle}</p>
            <p className="text-body-sm text-navy-300 mt-1.5">{dict.home.ctaSub}</p>
            <Link href={`/${L}/contact?sujet=fiche&etablissement=${e.slug}`} className="inline-block mt-4 rounded-button bg-signal-300 text-navy-900 px-4 py-2 text-body-sm font-bold hover:bg-signal-200 transition-colors">{t.updateThis}</Link>
          </div>
        </aside>
      </section>
    </>
  );
}
