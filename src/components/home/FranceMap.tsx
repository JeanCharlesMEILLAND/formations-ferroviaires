"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { RegionNode } from "@/lib/home";
import { FRANCE_REGIONS, FRANCE_VIEW } from "./france-regions";

/**
 * Carte de France : vraies formes des régions (GeoJSON officiel simplifié, projection Lambert),
 * une bulle par région dimensionnée par le nombre d'établissements vérifiés, étiquette HTML au survol.
 */
export default function FranceMap({
  regions, locale, caption, unitOne, unitMany, none, propose,
}: { regions: RegionNode[]; locale: string; caption: string; unitOne: string; unitMany: string; none: string; propose: string }) {
  const [hover, setHover] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const counts = new Map(regions.map((r) => [r.code, r.count]));
  const { w, h } = FRANCE_VIEW;
  const PAD = 8;
  const shapes = FRANCE_REGIONS.map((s, i) => ({ ...s, count: counts.get(s.code) ?? 0, i }));
  const radius = (c: number) => 11 + Math.sqrt(c) * 2.3;
  const active = shapes.find((s) => s.code === hover);

  // Tracé « dessiné » à l'ouverture : la longueur de chaque contour sert de tiret
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    svg.querySelectorAll<SVGPathElement>(".fr-region").forEach((p) => {
      const len = Math.ceil(p.getTotalLength());
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
    });
    requestAnimationFrame(() => svg.classList.add("is-ready"));
  }, []);

  const tipLeft = active ? ((active.cx + PAD) / (w + 2 * PAD)) * 100 : 0;
  const tipTop = active ? ((active.cy + PAD - (active.count ? radius(active.count) : 10)) / (h + 2 * PAD)) * 100 : 0;

  return (
    <figure className="m-0 fr-map">
      <div className="relative">
      <svg ref={svgRef} viewBox={`${-PAD} ${-PAD} ${w + 2 * PAD} ${h + 2 * PAD}`} className="w-full h-auto overflow-visible" role="img" aria-label={caption}>
        <defs>
          <filter id="fr-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {shapes.map((s) => (
          <path
            key={s.code}
            d={s.d}
            className={`fr-region ${hover === s.code ? "is-hot" : ""}`}
            style={{ animationDelay: `${s.i * 45}ms` }}
            onMouseEnter={() => setHover(s.code)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        {shapes.map((s) => {
          const empty = s.count === 0;
          const r = empty ? 10 : radius(s.count);
          return (
            <Link
              key={s.code}
              href={empty ? `/${locale}/contact?sujet=nouveau` : `/${locale}/carte?region=${s.code}`}
              className={`fr-node ${empty ? "is-empty" : ""} ${hover === s.code ? "is-hot" : ""}`}
              style={{ animationDelay: `${900 + s.i * 55}ms` }}
              onMouseEnter={() => setHover(s.code)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(s.code)}
              onBlur={() => setHover(null)}
              aria-label={`${s.name} : ${empty ? none : `${s.count} ${s.count > 1 ? unitMany : unitOne}`}`}
            >
              {!empty && <circle cx={s.cx} cy={s.cy} r={r + 7} className="fr-halo" />}
              <circle cx={s.cx} cy={s.cy} r={r} className="fr-bubble" />
              <text x={s.cx} y={s.cy + 4.5} textAnchor="middle" className="fr-count">{s.count}</text>
            </Link>
          );
        })}
      </svg>
      {active && (
        <div className={`fr-tip ${tipLeft > 78 ? "is-right" : tipLeft < 18 ? "is-left" : ""}`} style={{ left: `${tipLeft}%`, top: `${tipTop}%` }} role="status">
          <div className="fr-tip-in">
            <strong>{active.name}</strong>
            <span>{active.count > 0 ? `${active.count} ${active.count > 1 ? unitMany : unitOne}` : none}</span>
            {active.count === 0 && <span className="fr-tip-cta">{propose} →</span>}
          </div>
        </div>
      )}
      </div>
      <figcaption className="text-caption text-navy-300 text-center mt-3">{caption}</figcaption>
    </figure>
  );
}
