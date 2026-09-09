import Link from "next/link";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getHomeData, type FamilyCard } from "@/lib/home";
import FranceMap from "@/components/home/FranceMap";
import HeroSearch from "@/components/home/HeroSearch";
import { CONTACT_MAILTO } from "@/components/layout/Header";
import { displayName } from "@/lib/format";

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

/** Pictogrammes et couleurs par famille de métiers. */
const FAMILY_STYLE: Record<string, { d: string; color: string; soft: string }> = {
  Conduite: { d: "M4 16h16M6 16V9a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v7M8 20h8M7 12h10", color: "#A67D0A", soft: "#FFF7D6" },
  Maintenance: { d: "M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2-2 2.4-2.4Z", color: "#1B8C6E", soft: "#DDF3EA" },
  "Gestion du trafic": { d: "M12 3v18M5 8h14M7 8v4M17 8v4M9 12h6", color: "#12303F", soft: "#E4ECEF" },
  Ingénierie: { d: "M3 20h18M5 20V9l7-5 7 5v11M9 20v-6h6v6", color: "#E84A28", soft: "#FFEDE8" },
  Infrastructure: { d: "M3 17h18M3 13h18M6 13V7M12 13V7M18 13V7M4 7h16", color: "#3C4E5C", soft: "#E4ECEF" },
};
const FAMILY_DEFAULT = { d: "M4 19h16M6 19V7l6-3 6 3v12M10 19v-4h4v4", color: "#6C7C88", soft: "#F1F3F2" };

function FamilyIcon({ label }: { label: string }) {
  const st = FAMILY_STYLE[label] ?? FAMILY_DEFAULT;
  return (
    <span className="family-tile" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={st.d} /></svg>
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

/** Niveaux du cadre national des certifications (3 = CAP … 8 = doctorat), avec leur équivalent en années après le bac. */
const PARCOURS = [
  { n: "3", level: "cap-niv3", eq: { fr: "CAP", en: "vocational certificate" }, ex: "CAP maintenance des véhicules", sub: "Lycées pro, CFA" },
  { n: "4", level: "bac-niv4", eq: { fr: "bac", en: "high-school diploma" }, ex: "Bac pro MELEC, MSPC", sub: "Lycées des métiers", hot: true },
  { n: "4+", level: "bac1-cs", eq: { fr: "bac + 1", en: "1 year after" }, ex: "MC4 maintenance des installations ferroviaires", sub: "Campus ferroviaires" },
  { n: "5", level: "bts-niv5", eq: { fr: "bac + 2", en: "2 years after" }, ex: "BTS électrotechnique, BTS MS", sub: "Alternance possible", hot: true },
  { n: "6", level: "licence-niv6", eq: { fr: "bac + 3", en: "3 years after" }, ex: "Licence pro GMSF, BUT GEII", sub: "IUT, universités" },
  { n: "7", level: "master-niv7", eq: { fr: "bac + 5", en: "5 years after" }, ex: "Ingénieur ferroviaire et transports guidés", sub: "ESTACA, IMT, ENTPE", hot: true },
  { n: "8", level: "mastere-niv8", eq: { fr: "bac + 6 et plus", en: "6 years and more" }, ex: "Mastère spécialisé smart mobility", sub: "Grandes écoles" },
  { n: "★", level: "certification-pro", eq: { fr: "certifications", en: "certifications" }, ex: "SECUFER, TES, licence européenne", sub: "Organismes agréés EPSF" },
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

            <HeroSearch action={carte} label={dict.map.searchLabel} suggestions={dict.map.suggestions} nearHref={`${carte}?near=1`} nearLabel={dict.home.nearButton} submitLabel={dict.home.searchButton} />

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
            <FranceMap regions={data.regions} locale={L} caption={dict.home.networkCaption} unitOne={dict.map.verifiedOne} unitMany={dict.map.verifiedMany} none={dict.home.noneYet} />
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
          {data.families.map((f: FamilyCard, i) => {
            const st = FAMILY_STYLE[f.label] ?? FAMILY_DEFAULT;
            const more = f.jobs.length - 4;
            return (
              <Link key={f.key} href={`${carte}?family=${encodeURIComponent(f.key)}`} className="family-card" style={{ "--fam": st.color, "--fam-soft": st.soft, animationDelay: `${i * 60}ms` } as React.CSSProperties}>
                <span className="family-head">
                  <FamilyIcon label={f.label} />
                  <span className="min-w-0">
                    <span className="block font-heading text-h4 leading-tight text-navy-900">{f.label}</span>
                    <span className="family-stats">{f.jobCount} {dict.home.jobs} · {f.formationCount} {dict.home.formationsWord}</span>
                  </span>
                </span>
                <span className="family-jobs">
                  {f.jobs.slice(0, 4).map((j) => <span key={j} className="family-job">{j}</span>)}
                  {more > 0 && <span className="family-job is-more">+{more}</span>}
                </span>
                <span className="family-foot">
                  {dict.home.seeFormations}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="w-4 h-4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------ parcours */}
      <section id="parcours" className="max-w-content mx-auto px-container pb-section w-full">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-2">
          <div>
            <h2 className="font-heading text-h2">{dict.home.parcoursTitle}</h2>
            <p className="text-navy-600 max-w-[60ch] mt-1.5">{dict.home.parcoursSub}</p>
            <p className="text-caption text-navy-500 max-w-[70ch] mt-2 flex items-start gap-2">
              <span className="w-5 h-5 rounded-full border-2 border-navy-900 grid place-items-center font-mono text-[9px] font-bold shrink-0 mt-0.5" aria-hidden="true">5</span>
              <span>{dict.home.parcoursLegend}</span>
            </p>
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
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-navy-400 mt-2.5">{p.n === "★" ? p.eq[L] : `${dict.home.levelWord} ${p.n} · ${p.eq[L]}`}</span>
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
            {data.campuses.map((c, i) => (
              <Link key={c.slug} href={`/${L}/etablissement/${c.slug}`} className="campus-card group" style={{ animationDelay: `${i * 60}ms` }}>
                <span className="campus-rail" style={{ background: c.typeColor }} aria-hidden="true" />
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ background: c.typeColor }}>{c.type}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-eco-50 text-eco-700">✓ {dict.map.verifiedBadge}</span>
                  </span>
                  <span className="block font-heading text-h4 leading-tight text-navy-900 group-hover:text-electric-600 transition-colors">{displayName(c.name)}</span>
                  <span className="block text-caption text-navy-500 mt-1">{c.city} · {c.region}</span>
                </span>
                <span className="campus-arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="w-4 h-4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </span>
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
