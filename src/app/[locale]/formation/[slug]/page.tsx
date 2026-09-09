import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getFormationPage } from "@/lib/data";
import { Crumbs, EstablishmentsByRegion, fill } from "@/components/fiches/parts";

export const revalidate = 600;

export async function generateMetadata({ params }: { params: { locale: Locale; slug: string } }): Promise<Metadata> {
  const [dict, f] = await Promise.all([getDictionary(params.locale), getFormationPage(params.slug)]);
  if (!f) return {};
  return {
    title: `${f.nameFr} : ${dict.fiches.whereToTrain.toLowerCase()}`,
    description: fill(dict.fiches.metaFormation, { name: f.nameFr }),
    alternates: { canonical: `/${params.locale}/formation/${f.slug}` },
  };
}

export default async function FormationPage({ params }: { params: { locale: Locale; slug: string } }) {
  const [dict, f] = await Promise.all([getDictionary(params.locale), getFormationPage(params.slug)]);
  if (!f) notFound();
  const L = params.locale, fr = L === "fr", t = dict.fiches;
  const verified = f.establishments.map((e) => e.establishment).filter((e) => e.source !== "api");
  const generalists = f.establishments.length - verified.length;
  const levelName = fr ? f.level.nameFr : f.level.nameEn;
  const domainName = fr ? f.domain.nameFr : f.domain.nameEn;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: f.nameFr,
    description: f.jobTarget || fill(t.metaFormation, { name: f.nameFr }),
    educationalCredentialAwarded: f.rncpCode ? `RNCP ${f.rncpCode}` : levelName,
    provider: verified.slice(0, 30).map((e) => ({ "@type": "EducationalOrganization", name: e.name, address: { "@type": "PostalAddress", addressLocality: e.city, addressCountry: "FR" } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="bg-gradient-to-b from-navy-900 to-navy-800 text-white">
        <div className="max-w-content mx-auto px-container py-10 lg:py-14">
          <Crumbs items={[{ href: `/${L}`, label: t.breadcrumbHome }, { href: `/${L}/carte?view=formations`, label: dict.home.doorFormation }, { label: f.nameFr }]} />
          <p className="font-mono text-caption font-bold uppercase tracking-[.16em] text-signal-300 mt-5">{t.formationKicker} · {levelName} · {domainName}</p>
          <h1 className="font-heading text-h1 mt-2 text-balance">{f.nameFr}</h1>
          {f.jobTarget && <p className="text-body-lg text-navy-300 max-w-[64ch] mt-3">{f.jobTarget}</p>}
          <div className="flex flex-wrap gap-2.5 mt-6">
            <Link href={`/${L}/carte?formation=${f.slug}`} className="rounded-button bg-electric-500 hover:bg-electric-600 text-white px-5 py-2.5 font-bold text-body-sm transition-colors">{t.seeOnMap}</Link>
            {f.rncpCode && (
              <a href={`https://www.francecompetences.fr/recherche/rncp/${encodeURIComponent(f.rncpCode)}/`} target="_blank" rel="noopener noreferrer" className="rounded-button border border-white/25 px-5 py-2.5 font-bold text-body-sm hover:border-signal-300 transition-colors">
                RNCP {f.rncpCode} <span className="text-navy-300 font-semibold">· {t.rncpLink}</span>
              </a>
            )}
            {f.onisepUrl && <a href={f.onisepUrl} target="_blank" rel="noopener noreferrer" className="rounded-button border border-white/25 px-5 py-2.5 font-bold text-body-sm hover:border-signal-300 transition-colors">{t.onisep}</a>}
          </div>
        </div>
      </section>

      <section className="max-w-content mx-auto px-container py-10 lg:py-14 w-full grid gap-8 lg:grid-cols-[1fr_.55fr] items-start">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <h2 className="font-heading text-h3">{t.whereToTrain}</h2>
            <p className="text-caption text-navy-500">
              {verified.length === 1 ? t.verifiedOne : fill(t.verifiedCount, { n: verified.length })}
              {generalists > 0 && <> · <Link href={`/${L}/carte?formation=${f.slug}`} className="underline">{fill(t.alsoGeneralists, { n: generalists })}</Link></>}
            </p>
          </div>
          {verified.length > 0 ? (
            <EstablishmentsByRegion items={verified} locale={L} />
          ) : (
            <div className="bg-white border border-navy-200 rounded-card p-6 text-navy-600">
              {t.noEstablishment} <Link href={`/${L}/contact?sujet=nouveau`} className="font-bold underline text-navy-900">{t.propose}</Link>
            </div>
          )}
        </div>
        <aside className="space-y-5 lg:sticky lg:top-24">
          <div className="bg-white border border-navy-200 rounded-card p-6">
            <h2 className="font-heading text-h4">{t.targetJobs}</h2>
            {f.metiers.length === 0 ? <p className="text-body-sm text-navy-500 mt-2">{t.noFormation}</p> : (
              <ul className="mt-3 space-y-1.5">
                {f.metiers.map(({ metier: m }) => (
                  <li key={m.slug}>
                    <Link href={`/${L}/metier/${m.slug}`} className="flex items-center gap-2.5 rounded-xl px-3 py-2 -mx-3 hover:bg-navy-50 transition-colors group">
                      <span className="w-8 h-8 rounded-lg bg-signal-50 text-signal-700 grid place-items-center shrink-0" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="w-4 h-4"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold text-[14px] text-navy-900 group-hover:text-electric-600 transition-colors">{m.nameFr}</span>
                        <span className="block text-caption text-navy-500">{m.family}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-navy-900 text-white rounded-card p-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-signal-300">{t.levelWord}</p>
            <p className="font-heading text-h3 mt-1">{levelName}</p>
            <p className="text-body-sm text-navy-300 mt-2">{domainName}</p>
            <Link href={`/${L}/carte?level=${f.level.slug}`} className="inline-block mt-4 text-body-sm font-bold border-b-2 border-signal-300">{dict.home.parcoursTitle} →</Link>
          </div>
        </aside>
      </section>
    </>
  );
}
