import dynamic from "next/dynamic";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

const FormationsMap = dynamic(
  () => import("@/components/map/FormationsMap"),
  { ssr: false, loading: () => (
    <div className="h-[calc(100vh-6rem)] flex items-center justify-center bg-navy-50">
      <div className="text-center">
        <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-electric-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-navy-400 text-body-sm">Chargement de la carte...</p>
      </div>
    </div>
  )}
);

export default async function MapPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const dict = await getDictionary(params.locale);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 text-white py-3 lg:py-4">
        <div className="max-w-content mx-auto px-container text-center">
          <h1 className="font-heading text-lg lg:text-xl font-bold mb-1">{dict.hero.title}</h1>
          <p className="text-sm text-navy-200 max-w-2xl mx-auto">
            {dict.hero.subtitle}
          </p>
        </div>
      </section>

      {/* Map section */}
      <section className="max-w-[1800px] mx-auto px-2 lg:px-4 py-4">
        <FormationsMap dict={dict} locale={params.locale} />
      </section>
    </div>
  );
}
