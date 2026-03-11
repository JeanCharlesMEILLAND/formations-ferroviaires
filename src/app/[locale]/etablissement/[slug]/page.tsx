import { notFound } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getEstablishmentBySlug } from "@/lib/data";

export default async function EstablishmentPage({
  params,
}: {
  params: { locale: Locale; slug: string };
}) {
  const [dict, establishment] = await Promise.all([
    getDictionary(params.locale),
    getEstablishmentBySlug(params.slug),
  ]);

  if (!establishment) notFound();

  const locale = params.locale;

  // Group formations by domain
  const formationsByDomain: Record<string, typeof establishment.formations> = {};
  for (const ef of establishment.formations) {
    const domainName = locale === "fr" ? ef.formation.domain.nameFr : ef.formation.domain.nameEn;
    if (!formationsByDomain[domainName]) {
      formationsByDomain[domainName] = [];
    }
    formationsByDomain[domainName].push(ef);
  }

  return (
    <div className="bg-navy-50/30 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white py-10 lg:py-14">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-navy-300 hover:text-white text-sm mb-8 transition-colors group"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-1 transition-transform">
              <path d="M14 10H6M6 10l4-4M6 10l4 4" />
            </svg>
            {dict.establishment.backToMap}
          </Link>

          <div className="flex items-center gap-3 mb-3">
            <span
              className="px-3 py-1 rounded-full text-white text-xs font-semibold tracking-wide uppercase"
              style={{ backgroundColor: establishment.type.color }}
            >
              {locale === "fr" ? establishment.type.nameFr : establishment.type.nameEn}
            </span>
            <span className="text-navy-400 text-xs">
              {establishment.region.name}
            </span>
          </div>

          <h1 className="font-heading text-3xl lg:text-4xl font-bold mb-3 leading-tight">{establishment.name}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-navy-200">
            <span className="flex items-center gap-1.5">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-electric-400">
                <circle cx="8" cy="7" r="3" />
                <path d="M8 14s-5-3.5-5-7a5 5 0 1110 0c0 3.5-5 7-5 7z" />
              </svg>
              {establishment.city}
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-electric-400">
                <path d="M2 3h12v10H2zM6 3V1M10 3V1M2 7h12" />
              </svg>
              {establishment.formations.length} {establishment.formations.length <= 1 ? "formation" : "formations"}
            </span>
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            {establishment.website && (
              <a
                href={establishment.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-navy-900 rounded-lg text-sm font-semibold hover:bg-navy-50 transition-colors"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="7" cy="7" r="6" />
                  <path d="M1 7h12M7 1a10 10 0 013 6 10 10 0 01-3 6 10 10 0 01-3-6A10 10 0 017 1z" />
                </svg>
                {dict.establishment.website}
              </a>
            )}
            {establishment.onisepUrl && (
              <a
                href={establishment.onisepUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
              >
                ONISEP
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 8l4-4M4 4h4v4" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-6 lg:px-8 py-10">
        {/* Formations */}
        {establishment.formations.length > 0 ? (
          <div className="mb-10">
            <h2 className="font-heading text-xl font-bold text-navy-900 mb-6 flex items-center gap-3">
              <span className="w-1 h-6 bg-electric-500 rounded-full" />
              {dict.establishment.formations}
            </h2>

            {Object.entries(formationsByDomain).map(([domain, formations]) => (
              <div key={domain} className="mb-8">
                <h3 className="font-heading text-sm font-bold text-navy-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: formations[0].formation.domain.color }}
                  />
                  {domain}
                </h3>
                <div className="grid gap-3">
                  {formations.map((ef) => {
                    const linkedMetiers = (ef.formation as unknown as { metiers?: Array<{ metier: { slug: string; nameFr: string; family: string; source: string } }> }).metiers || [];
                    return (
                    <div
                      key={ef.formation.id}
                      className="bg-white rounded-xl p-5 shadow-sm border border-navy-100/60 hover:shadow-md hover:border-navy-200 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-heading font-semibold text-navy-900 mb-1.5">
                            {ef.formation.nameFr}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-navy-50 text-navy-600 rounded-md text-xs font-medium">
                              {locale === "fr"
                                ? ef.formation.level.nameFr
                                : ef.formation.level.nameEn}
                            </span>
                            {ef.formation.rncpCode && (
                              <span className="px-2 py-0.5 bg-electric-50 text-electric-700 rounded-md text-xs font-medium">
                                RNCP {ef.formation.rncpCode}
                              </span>
                            )}
                          </div>
                          {ef.formation.jobTarget && (
                            <p className="text-sm text-navy-500 leading-relaxed">
                              {ef.formation.jobTarget}
                            </p>
                          )}
                          {/* Métiers liés */}
                          {linkedMetiers.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                              {linkedMetiers.map((mf) => (
                                <div key={mf.metier.slug} className="flex flex-wrap items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
                                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/></svg>
                                    {mf.metier.nameFr}
                                  </span>
                                  <a
                                    href="https://www.futurentrain.fr/metiers/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                    title="Futur en Train"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/logos/futur-en-train.svg" alt="" width={13} height={13} className="rounded-sm" />
                                    Futur en Train
                                    <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40"><path d="M3 6l3-3M3 3h3v3" /></svg>
                                  </a>
                                  <a
                                    href="https://www.aveclindustrieferroviaire.fr/metiers"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
                                    title="Avec l'Industrie Ferroviaire"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/logos/avec-industrie-ferroviaire.svg" alt="" width={13} height={13} className="rounded-sm" />
                                    Industrie Ferro.
                                    <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40"><path d="M3 6l3-3M3 3h3v3" /></svg>
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {ef.formation.onisepUrl && (
                        <a
                          href={ef.formation.onisepUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs text-electric-600 hover:text-electric-700 font-semibold"
                        >
                          Voir sur ONISEP
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 8l4-4M4 4h4v4" />
                          </svg>
                        </a>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 text-center mb-10 shadow-sm border border-navy-100/60">
            <p className="text-navy-400 text-sm">{dict.common.noData}</p>
          </div>
        )}

        {/* External links */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-navy-100/60">
          <h3 className="font-heading text-sm font-bold text-navy-500 uppercase tracking-wider mb-4 flex items-center gap-3">
            <span className="w-1 h-5 bg-navy-300 rounded-full" />
            {dict.map.externalLinks}
          </h3>
          <div className="flex flex-wrap gap-3">
            {establishment.website && (
              <a
                href={establishment.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800 transition-colors"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="7" cy="7" r="6" />
                  <path d="M1 7h12M7 1a10 10 0 013 6 10 10 0 01-3 6 10 10 0 01-3-6A10 10 0 017 1z" />
                </svg>
                {dict.establishment.website}
              </a>
            )}
            {establishment.onisepUrl && (
              <a
                href={establishment.onisepUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-navy-200 rounded-lg text-sm text-navy-700 hover:bg-navy-50 transition-colors"
              >
                ONISEP
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 8l4-4M4 4h4v4" />
                </svg>
              </a>
            )}
            <a
              href="https://www.futurentrain.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-4 py-3 bg-white border border-navy-200 rounded-lg text-sm text-navy-700 font-semibold hover:shadow-md transition-all"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/futur-en-train.svg" alt="Futur en Train" width={28} height={28} className="rounded" />
              Futur en Train
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" className="text-navy-400">
                <path d="M4 8l4-4M4 4h4v4" />
              </svg>
            </a>
            <a
              href="https://www.aveclindustrieferroviaire.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-4 py-3 bg-white border border-navy-200 rounded-lg text-sm text-navy-700 font-semibold hover:shadow-md transition-all"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/avec-industrie-ferroviaire.svg" alt="Avec l'Industrie Ferroviaire" width={28} height={28} className="rounded" />
              Avec l&apos;Industrie Ferroviaire
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" className="text-navy-400">
                <path d="M4 8l4-4M4 4h4v4" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
