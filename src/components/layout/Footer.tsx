"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

const PARTNERS = ["Objectif OFP", "IA k LEFER"];

export default function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname();
  // La carte occupe tout l'écran : pas de pied de page sous elle.
  if (pathname?.includes("/carte")) return null;

  return (
    <footer className="border-t border-navy-200 bg-navy-50 text-navy-500">
      <div className="max-w-content mx-auto px-container py-8">
        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 pb-6 text-body-sm font-bold text-navy-400">
          {PARTNERS.map((p) => (
            <span key={p}>{p}</span>
          ))}
        </div>
        <div className="flex flex-col md:flex-row justify-between gap-3 text-caption border-t border-navy-200 pt-5">
          <p className="max-w-xl">
            {dict.meta.siteName} · {dict.home.partners}
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <span>{locale === "fr" ? "Données : établissements déclarés, ONISEP, La Bonne Alternance, EPSF" : "Data: declared institutions, ONISEP, La Bonne Alternance, EPSF"}</span>
            <a href="https://www.futurentrain.fr/formations/" target="_blank" rel="noopener noreferrer" className="underline hover:text-navy-900">Futur en train</a>
            <a href="https://www.onisep.fr" target="_blank" rel="noopener noreferrer" className="underline hover:text-navy-900">ONISEP</a>
            <Link href="/admin" className="underline hover:text-navy-900">{dict.nav.admin}</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
