"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { displayName } from "@/lib/format";
import { distanceKm, type Establishment } from "./types";

/** Fiche flottante d'un établissement choisi sur la carte ou dans la liste. */
export default function EstablishmentCard({
  est,
  locale,
  dict,
  userPos,
  onClose,
  className = "",
}: {
  est: Establishment;
  locale: Locale;
  dict: Dictionary;
  userPos: [number, number] | null;
  onClose: () => void;
  className?: string;
}) {
  const m = dict.map;
  const api = est.source === "api";
  const formations = [...est.formations].sort((a, b) => a.formation.level.order - b.formation.level.order || a.formation.nameFr.localeCompare(b.formation.nameFr));
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${est.lat},${est.lng}`;

  return (
    <article className={`est-card ${className}`} aria-label={displayName(est.name)}>
      <div className="flex items-start gap-3 p-4 pb-3">
        <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0 text-white" style={{ background: est.type.color }} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" /></svg>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ background: est.type.color }}>
              {locale === "fr" ? est.type.nameFr : est.type.nameEn}
            </span>
            {api ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-signal-50 text-signal-800 border border-signal-200">{m.generalistBadge}</span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-eco-50 text-eco-700">✓ {m.verifiedBadge}</span>
            )}
          </div>
          <h3 className="font-heading font-bold text-[15px] leading-tight text-navy-900 text-balance">{displayName(est.name)}</h3>
          <p className="text-caption text-navy-400 mt-0.5">
            {est.city} · {est.region.name}
            {userPos && <span className="font-bold text-navy-700"> · {Math.round(distanceKm(userPos, [est.lat, est.lng]))} km</span>}
          </p>
        </div>
        <button type="button" onClick={onClose} className="w-8 h-8 -mr-1 -mt-1 rounded-full grid place-items-center text-navy-400 hover:bg-navy-100 hover:text-navy-900 transition-colors shrink-0" aria-label={m.close}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="w-4 h-4" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      {formations.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-navy-400 mb-1.5">
            {formations.length} {formations.length > 1 ? m.formations : m.formation}
          </p>
          <ul className="max-h-36 overflow-y-auto custom-scrollbar space-y-1 pr-1">
            {formations.slice(0, 12).map(({ formation: f }) => (
              <li key={f.id} className="flex items-start gap-2 text-caption text-navy-700 leading-snug">
                <span className="w-1.5 h-1.5 rounded-full mt-[6px] shrink-0" style={{ background: f.domain.color }} aria-hidden="true" />
                <span>
                  {f.nameFr}
                  <span className="text-navy-300"> · {locale === "fr" ? f.level.nameFr : f.level.nameEn}</span>
                </span>
              </li>
            ))}
            {formations.length > 12 && <li className="text-caption text-electric-600 font-bold">+{formations.length - 12}</li>}
          </ul>
        </div>
      )}

      <div className="flex gap-2 px-4 pb-4">
        <Link href={`/${locale}/etablissement/${est.slug}`} className="flex-1 inline-flex justify-center items-center rounded-button bg-navy-900 text-white text-caption font-bold px-3 py-2.5 hover:bg-navy-800 transition-colors">
          {m.seeDetails}
        </Link>
        {est.website && (
          <a href={est.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-button border border-navy-200 text-navy-800 text-caption font-bold px-3 py-2.5 hover:border-navy-900 transition-colors">
            {m.website}
          </a>
        )}
        <a href={directions} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-button border border-navy-200 text-navy-800 text-caption font-bold px-3 py-2.5 hover:border-navy-900 transition-colors" title={m.directions}>
          <span aria-hidden="true">➜</span><span className="sr-only">{m.directions}</span>
        </a>
      </div>
    </article>
  );
}
