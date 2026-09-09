import nextDynamic from "next/dynamic";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import type { InitialFilters } from "@/components/map/FormationsMap";

export const dynamic = "force-dynamic"; // les filtres viennent de l'adresse

const FormationsMap = nextDynamic(() => import("@/components/map/FormationsMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex bg-navy-50">
      <div className="hidden lg:flex w-[440px] shrink-0 flex-col gap-3 bg-white border-r border-navy-100 p-4" aria-hidden="true">
        <div className="h-16 rounded-2xl bg-navy-100 animate-pulse" />
        <div className="flex gap-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-8 w-24 rounded-full bg-navy-100 animate-pulse" />)}</div>
        <div className="h-9 w-44 rounded-lg bg-navy-100 animate-pulse mt-3" />
        <div className="h-11 rounded-2xl bg-navy-100 animate-pulse" />
        {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 rounded-xl bg-navy-50 border border-navy-100 animate-pulse" />)}
      </div>
      <div className="flex-1 grid place-items-center text-navy-400 text-body-sm">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-electric-500" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Chargement de la carte…
        </div>
      </div>
    </div>
  ),
});

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const dict = await getDictionary(params.locale);
  return {
    title: dict.nav.map,
    description: dict.hero.subtitle,
    alternates: { canonical: `/${params.locale}/carte` },
    robots: { index: true, follow: true },
  };
}

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function CartePage({ params, searchParams }: { params: { locale: Locale }; searchParams: Search }) {
  const dict = await getDictionary(params.locale);
  const view = one(searchParams.view);
  const initial: InitialFilters = {
    search: one(searchParams.q),
    metier: one(searchParams.metier),
    formation: one(searchParams.formation),
    region: one(searchParams.region),
    level: one(searchParams.level),
    domain: one(searchParams.domain),
    type: one(searchParams.type),
    family: one(searchParams.family),
    near: one(searchParams.near) === "1",
    establishment: one(searchParams.etablissement),
    view: view === "formations" || view === "metiers" ? view : undefined,
  };

  return (
    <div className="h-[calc(100vh-4rem)] h-[calc(100dvh-4rem)] min-h-[520px] flex flex-col">
      <div className="flex-1 min-h-0">
        <FormationsMap dict={dict} locale={params.locale} initial={initial} />
      </div>
    </div>
  );
}
