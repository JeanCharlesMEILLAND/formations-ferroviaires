import Link from "next/link";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getHomeData, type FamilyCard } from "@/lib/home";
import RegionNetwork from "@/components/home/RegionNetwork";
import { CONTACT_MAILTO } from "@/components/layout/Header";

export const revalidate = 600; // dix minutes : la page reste instantanée même quand la base se réveille

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const dict = await getDictionary(params.locale);
  return {
    title: { absolute: `${dict.meta.siteName}, ${dict.meta.tagline.toLowerCase()}` },
    description: dict.home.lead,
    alternates: { canonical: `/${params.locale}`, languages: { fr: "/fr", en: "/en" } },
    openGraph: { title: `${dict.meta.siteName}`, description: dict.home.lead, url: `/${params.locale}` },
  };
}

function fill(template: string, values: Record<string, number | string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ""));
}

/** Pictogrammes par famille de métiers (traits simples, couleur de l'encre). */
function FamilyIcon({ label }: { label: string }) {
  const paths: Record<string, string> = {
    Conduite: "M4 16h16M6 16V9a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v7M8 20h8M7 12h10",
    Maintenance: "M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2-2 2.4-2.4Z",
    "Gestion du trafic": "M12 3v18M5 8h14M7 8v4M17 8v4M9 12h6",
    Ingénierie: "M3 20h18M5 20V9l7-5 7 5v11M9 20v-6h6v6",
    Infrastructure: "M3 17h18M3 13h18M6 13V7M12 13V7M18 13V7M4 7h16",
  };
  const d = paths[label] ?? "M4 19h16M6 19V7l6-3 6 3v12M10 19v-4h4v4";
  return (
    <span className="w-11 h-11 rounded-xl bg-navy-100 grid place-items-center shrink-0" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-navy-900" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
    </span>
  );
}

const CHIPS: Array<{ label: string; family: string }> = [
  { label: "Conduite de train", family: "Conduite" },
  { label: "Maintenance", family: "Maintenance" },
  { label: "Gestion du trafic", family: "Gestion du trafic" },
  { label: "Voie et travaux", family: "Infrastructure" },
  { label: "Ingénierie", family: "Ingénierie" },
];

const PARCOURS = [
  { n: "3", level: "cap-niv3", label: "CAP", ex: "CAP maintenance des véhicules", sub: "Lycées pro, CFA" },
  { n: "4", level: "bac-niv4", label: "Bac pro", ex: "Bac pro MELEC, MSPC", sub: "Lycées des métiers", hot: true },
  { n: "4+", level: "bac1-cs", label: "Mention", ex: "MC4 maintenance des installations ferroviaires", sub: "Campus ferroviaires" },
  { n: "5", level: "bts-niv5", label: "BTS", ex: "BTS électrotechnique, BTS MS", sub: "Alternance possible", hot: true },
  { n: "6", level: "licence-niv6", label: "Licence, BUT", ex: "Licence pro GMSF, BUT GEII", sub: "IUT, universités" },
  { n: "7", level: "master-niv7", label: "Ingénieur", ex: "Ingénieur ferroviaire et transports guidés", sub: "ESTACA, IMT, ENTPE", hot: true },
  { n: "8", level: "mastere-niv8", label: "Mastère", ex: "Mastère spécialisé smart mobility", sub: "Grandes écoles" },
  { n: "★", level: "certification-pro", label: "Certifications", ex: "SECUFER, TES, licence européenne", sub: "Organismes agréés EPSF" },
];

export default async function HomePage({ params }: { params: { locale: Locale } }) {
  const [dict, data] = await Promise.all([getDictionary(params.locale), getHomeData()]);
  const L = params.locale;
  const carte = `/${L}/carte`;
  const v = { verified: data.verified, formations: data.formations, metiers: data.metiers };
  const updated = data.updatedAt
    ? new Intl.DateTimeFormat(L === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(data.updatedAt)
    : "";

  return (
    <>
      {/* ------------------------------------------------ hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-900 to-navy-800 text-white">
        <div className="max-w-content mx-auto px-container grid gap-10 lg:grid-cols-[1.15fr_.85fr] items-center py-12 lg:py-16">
          <div className="min-w-0">
            <p className="font-mono text-caption font-bold uppercase tracking-[.16em] text-signal-300">{fill(dict.home.kicker, v)}</p>
            <h1 className="font-heading text-display mt-3 mb-4 text-balance">
              {dict.home.title} <em className="not-italic text-signal-300">{dict.home.titleAccent}</em>
            </h1>
            <p className="text-body-lg text-navy-300 max-w-[56ch] mb-6">{dict.home.lead}</p>

            <form action={carte} method="get" role="search" className="flex flex-wrap gap-2 items-center bg-white rounded-2xl p-2 pl-4 shadow-search">
              <span className="font-heading font-extrabold text-navy-900" aria-hidden="true">⌕</span>
              <label htmlFor="home-q" className="sr-only">{dict.common.search}</label>
              <input
                id="home-q"
                name="q"
                type="search"
                placeholder={dict.home.searchPlaceholder}
                className="flex-1 min-w-[12rem] border-0 outline-none text-body-lg text-navy-900 placeholder:text-navy-400 bg-transparent py-2"
              />
              <Link href={`${carte}?near=1`} className="rounded-xl bg-navy-100 text-navy-900 px-3 py-2.5 text-body-sm font-bold whitespace-nowrap hover:bg-navy-200">
                ◎ {dict.home.nearButton}
              </Link>
              <button type="submit" className="rounded-xl bg-electric-500 hover:bg-electric-600 text-white px-5 py-3 text-body-sm font-extrabold">
                {dict.home.searchButton}
              </button>
            </form>

            <div className="flex flex-wrap gap-2 mt-4" aria-label={dict.home.frequent}>
              {CHIPS.map((c) => (
                <Link key={c.family} href={`${carte}?family=${encodeURIComponent(c.family)}`} className="text-caption font-semibold border border-white/25 rounded-button px-3 py-1.5 hover:border-signal-300 hover:text-signal-300 transition-colors">
                  {c.label}
                </Link>
              ))}
              <Link href={`${carte}?level=certification-pro`} className="text-caption font-semibold border border-white/25 rounded-button px-3 py-1.5 hover:border-signal-300 hover:text-signal-300 transition-colors">
                {L === "fr" ? "Reconversion" : "Career change"}
              </Link>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-3 mt-7">
              {[
                { href: `${carte}?view=metiers`, t: dict.home.doorJob, s: fill(dict.home.doorJobSub, v) },
                { href: `${carte}?view=formations`, t: dict.home.doorFormation, s: fill(dict.home.doorFormationSub, v) },
                { href: `${carte}?near=1`, t: dict.home.doorNear, s: dict.home.doorNearSub },
              ].map((d) => (
                <Link key={d.href} href={d.href} className="rounded-2xl border border-white/15 bg-white/[.06] p-4 hover:border-signal-300 transition-colors">
                  <span className="block font-heading font-bold text-h4">{d.t}</span>
                  <span className="block text-caption text-navy-300 mt-1">{d.s}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="max-w-md mx-auto w-full">
            <RegionNetwork regions={data.regions} locale={L} caption={`${dict.home.networkCaption}${updated ? ` · ${updated}` : ""}`} />
          </div>
        </div>
        <div className="h-1.5 bg-[repeating-linear-gradient(90deg,#FFD84D_0_40px,transparent_40px_56px)] opacity-90" aria-hidden="true" />
      </section>

      {/* ------------------------------------------------ chiffres */}
      <div className="bg-white border-b border-navy-200">
        <div className="max-w-content mx-auto px-container flex flex-wrap items-center gap-x-8 gap-y-3 py-4 text-body-sm text-navy-600">
          <span><b className="font-heading text-[22px] text-navy-900 mr-1.5">{data.verified}</b>{dict.home.trustVerified}</span>
          <span><b className="font-heading text-[22px] text-navy-900 mr-1.5">{data.formations}</b>{dict.home.trustFormations}</span>
          <span><b className="font-heading text-[22px] text-navy-900 mr-1.5">{data.metiers}</b>{dict.home.trustMetiers}</span>
          <span><b className="font-heading text-[22px] text-navy-900 mr-1.5">{data.regions.length}</b>{dict.home.trustRegions}</span>
          <span className="inline-flex items-center gap-2 font-bold text-eco-600"><span className="w-2 h-2 rounded-full bg-eco-500" aria-hidden="true" />{dict.home.trustWith}</span>
          {updated && <span className="font-mono text-caption text-navy-400">{dict.home.trustUpdated} {updated}</span>}
        </div>
      </div>

      {/* ------------------------------------------------ familles */}
      <section id="metiers" className="max-w-content mx-auto px-container py-section w-full">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-heading text-h2">{dict.home.familiesTitle}</h2>
            <p className="text-navy-600 max-w-[60ch] mt-1.5">{dict.home.familiesSub}</p>
          </div>
          <Link href={`${carte}?view=metiers`} className="font-bold border-b-2 border-signal-300 whitespace-nowrap">{dict.home.familiesAll}</Link>
        </div>
        <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {data.families.map((f: FamilyCard) => (
            <Link key={f.key} href={`${carte}?family=${encodeURIComponent(f.key)}`} className="bg-white border border-navy-200 rounded-card p-5 flex flex-col gap-2.5 hover:border-navy-900 hover:shadow-card-hover transition-all">
              <FamilyIcon label={f.label} />
              <h3 className="font-heading text-h4">{f.label}</h3>
              <span className="text-caption text-navy-400">{f.jobCount} {dict.home.jobs} · {f.formationCount} {dict.home.formationsWord}</span>
              <ul className="text-body-sm text-navy-600">
                {f.jobs.slice(0, 3).map((j) => (
                  <li key={j} className="py-1 border-t border-dashed border-navy-200">{j}</li>
                ))}
              </ul>
              <span className="text-caption font-bold text-electric-600 mt-auto">{dict.home.seeFormations} →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ parcours */}
      <section id="parcours" className="max-w-content mx-auto px-container pb-section w-full">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-2">
          <div>
            <h2 className="font-heading text-h2">{dict.home.parcoursTitle}</h2>
            <p className="text-navy-600 max-w-[60ch] mt-1.5">{dict.home.parcoursSub}</p>
          </div>
          <Link href={`${carte}?view=formations`} className="font-bold border-b-2 border-signal-300 whitespace-nowrap">{fill(dict.home.parcoursAll, v)}</Link>
        </div>
        <div className="overflow-x-auto pb-2 -mx-container px-container">
          <ol className="relative grid grid-cols-8 min-w-[1000px] mt-6 list-none p-0 m-0">
            <span className="absolute left-0 right-0 top-[19px] h-1 bg-[repeating-linear-gradient(90deg,#0C1F2C_0_22px,transparent_22px_30px)] opacity-30" aria-hidden="true" />
            {PARCOURS.map((p) => (
              <li key={p.level} className="px-2.5 relative">
                <Link href={`${carte}?level=${p.level}`} className="block group">
                  <span className={`w-10 h-10 rounded-full border-[3px] grid place-items-center font-mono font-bold text-caption ${p.hot ? "bg-signal-300 border-signal-300 text-navy-900" : "bg-white border-navy-900 text-navy-900"}`}>{p.n}</span>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-navy-400 mt-2.5">{p.label}</span>
                  <span className="block text-body-sm font-semibold mt-1 group-hover:text-electric-600">{p.ex}</span>
                  <span className="block text-caption text-navy-600">{p.sub}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------ campus */}
      <section id="campus" className="bg-white border-y border-navy-200">
        <div className="max-w-content mx-auto px-container py-section">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-heading text-h2">{dict.home.campusTitle}</h2>
              <p className="text-navy-600 max-w-[60ch] mt-1.5">{dict.home.campusSub}</p>
            </div>
            <Link href={carte} className="font-bold border-b-2 border-signal-300 whitespace-nowrap">{dict.home.campusAll}</Link>
          </div>
          <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
            {data.campuses.map((c) => (
              <Link key={c.slug} href={`/${L}/etablissement/${c.slug}`} className="bg-navy-50 border border-navy-200 rounded-card p-5 flex flex-col gap-2 hover:border-navy-900 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-heading text-h4 leading-tight">{c.name}</h3>
                    <p className="text-caption text-navy-600 mt-1">{c.city} · {c.region} · {c.type}</p>
                  </div>
                  <span className="font-heading text-[30px] font-extrabold leading-none text-navy-900 text-right">
                    {c.formationCount}
                    <small className="block font-body text-[11px] font-semibold text-navy-400">{dict.home.formationsWord}</small>
                  </span>
                </div>
                <ul className="text-caption text-navy-600 pl-4 list-disc">
                  {c.samples.map((s) => <li key={s}>{s}</li>)}
                </ul>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ appel aux établissements */}
      <section id="maj" className="max-w-content mx-auto px-container py-section w-full">
        <div className="bg-navy-900 text-white rounded-[20px] p-7 lg:p-9 grid gap-6 lg:grid-cols-[1.2fr_.8fr] items-center">
          <div>
            <h2 className="font-heading text-h2">{dict.home.ctaTitle}</h2>
            <p className="text-navy-300 mt-2 max-w-[60ch]">{dict.home.ctaSub}</p>
          </div>
          <div className="flex flex-wrap gap-2.5 lg:justify-end">
            <a href={CONTACT_MAILTO} className="rounded-button bg-electric-500 hover:bg-electric-600 text-white px-5 py-3 font-bold text-body-sm">{dict.home.ctaButton}</a>
            <a href={CONTACT_MAILTO} className="rounded-button border border-white/25 px-5 py-3 font-bold text-body-sm hover:border-signal-300">{dict.home.ctaSecondary}</a>
          </div>
        </div>
      </section>
    </>
  );
}
