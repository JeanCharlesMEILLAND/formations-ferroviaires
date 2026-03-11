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
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 text-white py-12">
        <div className="max-w-narrow mx-auto px-container">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-navy-300 hover:text-white text-body-sm mb-6 transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8H4M4 8l4-4M4 8l4 4" />
            </svg>
            {dict.establishment.backToMap}
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <span
              className="px-3 py-1 rounded-full text-white text-caption font-medium"
              style={{ backgroundColor: establishment.type.color }}
            >
              {locale === "fr" ? establishment.type.nameFr : establishment.type.nameEn}
            </span>
          </div>

          <h1 className="font-heading text-h1 mb-2">{establishment.name}</h1>
          <p className="text-navy-200 text-body-lg">
            {establishment.city} - {establishment.region.name}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-narrow mx-auto px-container py-section">
        {/* Formations */}
        <div className="mb-12">
          <h2 className="font-heading text-h2 text-navy-900 mb-6">
            {dict.establishment.formations}
          </h2>

          {Object.entries(formationsByDomain).map(([domain, formations]) => (
            <div key={domain} className="mb-8">
              <h3 className="font-heading text-h4 text-navy-700 mb-4 flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: formations[0].formation.domain.color }}
                />
                {domain}
              </h3>
              <div className="space-y-3">
                {formations.map((ef) => (
                  <div
                    key={ef.formation.id}
                    className="bg-white border border-navy-100 rounded-card p-5 shadow-card hover:shadow-card-hover transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-heading font-semibold text-navy-900 mb-1">
                          {ef.formation.nameFr}
                        </h4>
                        <p className="text-body-sm text-navy-400 mb-2">
                          {locale === "fr"
                            ? ef.formation.level.nameFr
                            : ef.formation.level.nameEn}
                        </p>
                        {ef.formation.jobTarget && (
                          <p className="text-body-sm text-navy-600">
                            {ef.formation.jobTarget}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {ef.formation.rncpCode && (
                          <span className="px-2.5 py-1 bg-electric-50 text-electric-700 rounded-button text-caption font-medium">
                            RNCP {ef.formation.rncpCode}
                          </span>
                        )}
                      </div>
                    </div>
                    {ef.formation.onisepUrl && (
                      <a
                        href={ef.formation.onisepUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-caption text-electric-600 hover:text-electric-700 font-medium"
                      >
                        {dict.establishment.onisep}
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 8l4-4M4 4h4v4" />
                        </svg>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {establishment.formations.length === 0 && (
            <p className="text-navy-400 text-body-sm">{dict.common.noData}</p>
          )}
        </div>

        {/* External links */}
        <div className="bg-navy-50 rounded-card p-6">
          <h3 className="font-heading text-h4 text-navy-900 mb-4">
            {dict.map.externalLinks}
          </h3>
          <div className="flex flex-wrap gap-3">
            {establishment.website && (
              <a
                href={establishment.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-navy-200 rounded-button text-body-sm text-navy-700 hover:bg-navy-100 transition-colors"
              >
                {dict.establishment.website}
              </a>
            )}
            {establishment.onisepUrl && (
              <a
                href={establishment.onisepUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-navy-200 rounded-button text-body-sm text-navy-700 hover:bg-navy-100 transition-colors"
              >
                ONISEP
              </a>
            )}
            <a
              href="https://www.futurentrain.fr/formations/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-electric-500 text-white rounded-button text-body-sm font-medium hover:bg-electric-600 transition-colors"
            >
              Futur en Train
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
