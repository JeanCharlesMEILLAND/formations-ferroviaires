import Link from "next/link";
import type { RegionNode } from "@/lib/home";

/** Libellés courts pour le schéma (les noms complets restent dans l'attribut title). */
const SHORT: Record<string, string> = {
  IDF: "Île-de-France", HDF: "Hauts-de-France", GES: "Grand Est", BFC: "Bourgogne-Franche-Comté",
  ARA: "Auvergne-Rhône-Alpes", PAC: "Provence-Alpes-Côte d'Azur", OCC: "Occitanie", NAQ: "Nouvelle-Aquitaine",
  PDL: "Pays de la Loire", BRE: "Bretagne", CVL: "Centre-Val de Loire", NOR: "Normandie", COR: "Corse",
};
const LEFT_LABEL = new Set(["BRE", "PDL", "NAQ"]);
/** Liaisons dessinées entre régions voisines : un schéma de réseau, pas une carte. */
const LINKS: Array<[string, string]> = [
  ["HDF", "IDF"], ["NOR", "IDF"], ["IDF", "GES"], ["IDF", "BFC"], ["BFC", "ARA"], ["IDF", "CVL"], ["CVL", "ARA"],
  ["ARA", "PAC"], ["ARA", "OCC"], ["CVL", "NAQ"], ["NAQ", "OCC"], ["OCC", "PAC"], ["IDF", "PDL"], ["PDL", "BRE"],
  ["PDL", "NAQ"], ["BRE", "NOR"], ["GES", "BFC"], ["HDF", "GES"],
];
const BOUNDS = { minLat: 42.4, maxLat: 51.3, minLng: -5.3, maxLng: 8.5 };
const W = 520, H = 560;
const VIEW = { x: -50, y: -10, w: 660, h: 585 }; // marges pour les libellés

function project(lat: number, lng: number): [number, number] {
  return [
    ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * W,
    ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * H,
  ];
}

export default function RegionNetwork({ regions, locale, caption }: { regions: RegionNode[]; locale: string; caption: string }) {
  const nodes = regions
    .filter((r) => r.lat >= BOUNDS.minLat && r.lat <= BOUNDS.maxLat && r.lng >= BOUNDS.minLng && r.lng <= BOUNDS.maxLng)
    .map((r) => { const [x, y] = project(r.lat, r.lng); return { ...r, x, y, r: 8 + Math.sqrt(r.count) * 2.6 }; });
  const byCode = new Map(nodes.map((n) => [n.code, n]));

  return (
    <figure className="m-0">
      <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} className="w-full h-auto" role="img" aria-label={caption}>
        <defs>
          <filter id="glow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {LINKS.map(([a, b]) => {
          const A = byCode.get(a), B = byCode.get(b);
          if (!A || !B) return null;
          return (
            <g key={`${a}-${b}`}>
              <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#22414F" strokeWidth="2" strokeLinecap="round" />
              <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#FFD84D" strokeWidth="2" strokeDasharray="3 9" strokeLinecap="round" />
            </g>
          );
        })}
        {nodes.map((n) => {
          const left = LEFT_LABEL.has(n.code);
          return (
            <Link key={n.code} href={`/${locale}/carte?region=${encodeURIComponent(n.code)}`} aria-label={`${SHORT[n.code] ?? n.name} : ${n.count}`}>
              <g className="cursor-pointer">
                <title>{`${n.name} : ${n.count}`}</title>
                <circle cx={n.x} cy={n.y} r={n.r + 6} fill="rgba(255,216,77,.12)" />
                <circle cx={n.x} cy={n.y} r={n.r} fill="#12303F" stroke="#FFD84D" strokeWidth="3" filter="url(#glow)" />
                <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#FFFFFF" fontFamily="var(--font-mono), monospace">{n.count}</text>
                <text x={left ? n.x - n.r - 8 : n.x + n.r + 8} y={n.y + 5} textAnchor={left ? "end" : "start"} fontSize="13" fontWeight="600" fill="#C9D8DF" fontFamily="var(--font-body), sans-serif">
                  {(SHORT[n.code] ?? n.name).replace("Bourgogne-Franche-Comté", "Bourgogne-F.-Comté").replace("Provence-Alpes-Côte d'Azur", "PACA").replace("Auvergne-Rhône-Alpes", "Auv.-Rhône-Alpes")}
                </text>
              </g>
            </Link>
          );
        })}
      </svg>
      <figcaption className="font-mono text-caption text-navy-300 mt-1">{caption}</figcaption>
    </figure>
  );
}
