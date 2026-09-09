import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getSelectionData } from "@/lib/selection-data";
import CompareTable from "@/components/selection/CompareTable";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const dict = await getDictionary(params.locale);
  return { title: dict.selection.title, description: dict.selection.metaDescription, robots: { index: false, follow: false } };
}

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";

export default async function SelectionPage({ params, searchParams }: { params: { locale: Locale }; searchParams: Search }) {
  const dict = await getDictionary(params.locale);
  const slugs = one(searchParams.s).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8);
  const items = slugs.length ? await getSelectionData(slugs) : [];
  const t = dict.selection;
  return (
    <>
      <section className="bg-gradient-to-b from-navy-900 to-navy-800 text-white">
        <div className="max-w-content mx-auto px-container py-10 lg:py-12">
          <p className="font-mono text-caption font-bold uppercase tracking-[.16em] text-signal-300">{t.kicker}</p>
          <h1 className="font-heading text-h1 mt-2">{t.title}</h1>
          <p className="text-body-lg text-navy-300 max-w-[62ch] mt-3">{t.lead.replace("{max}", "8")}</p>
        </div>
      </section>
      <section className="max-w-content mx-auto px-container py-8 lg:py-10 w-full">
        <CompareTable items={items} locale={params.locale} dict={dict} fromUrl={slugs} />
      </section>
    </>
  );
}
