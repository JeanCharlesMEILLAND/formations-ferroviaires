import Link from "next/link";
import type { RegionNode } from "@/lib/home";

/**
 * Silhouette de la France (tracé simplifié, coordonnées géographiques) avec une bulle par région,
 * dimensionnée par le nombre d'établissements vérifiés. Le nom n'apparaît qu'au survol ou au focus.
 */
const OUTLINE: Array<[number, number]> = [
  [51.05, 2.38], [50.95, 1.85], [50.72, 1.6], [50.52, 1.58], [50.2, 1.55], [49.92, 1.08], [49.49, 0.1], [49.33, -0.45],
  [49.65, -1.62], [49.72, -1.94], [48.83, -1.6], [48.64, -1.51], [48.65, -2.02], [48.68, -2.32], [48.52, -2.76], [48.72, -3.98],
  [48.33, -4.77], [48.04, -4.74], [47.8, -4.37], [47.72, -3.37], [47.48, -3.12], [47.47, -2.48], [47.27, -2.2], [47.11, -2.1],
  [46.98, -2.25], [46.5, -1.78], [46.16, -1.15], [45.62, -1.03], [45.57, -1.07], [45.0, -1.2], [44.66, -1.2], [44.2, -1.3],
  [43.64, -1.45], [43.48, -1.56], [43.37, -1.78], [43.1, -1.2], [42.8, -0.5], [42.75, 0.2], [42.7, 0.6], [42.55, 1.5],
  [42.45, 2.0], [42.47, 2.87], [42.44, 3.17], [42.55, 3.05], [43.15, 3.1], [43.4, 3.7], [43.53, 3.95], [43.45, 4.43],
  [43.43, 4.95], [43.3, 5.37], [43.21, 5.54], [43.1, 5.93], [43.05, 6.2], [43.27, 6.64], [43.42, 6.75], [43.55, 7.02],
  [43.7, 7.27], [43.78, 7.5], [44.08, 7.55], [44.2, 7.1], [44.42, 6.9], [44.9, 6.75], [45.2, 6.7], [45.83, 6.87],
  [46.2, 6.15], [46.39, 6.8], [46.4, 6.59], [46.2, 6.1], [46.4, 5.9], [46.9, 6.35], [47.06, 6.6], [47.5, 7.0],
  [47.58, 7.58], [48.1, 7.6], [48.58, 7.8], [48.97, 8.23], [49.03, 7.95], [49.05, 7.4], [49.19, 6.9], [49.5, 6.3],
  [49.52, 5.76], [49.7, 4.95], [50.14, 4.83], [50.28, 3.97], [50.35, 3.53], [50.7, 3.1], [50.7, 2.9],
];
const CORSICA: Array<[number, number]> = [
  [43.0, 9.45], [42.65, 9.47], [42.4, 9.55], [41.9, 9.4], [41.4, 9.2], [41.5, 8.8], [41.9, 8.6], [42.3, 8.55], [42.7, 8.7], [42.95, 9.3],
];

const MIN_LAT = 41.2, MAX_LAT = 51.2, MIN_LNG = -5.3, K = 60, KX = K * 0.69;
const project = (lat: number, lng: number): [number, number] => [(lng - MIN_LNG) * KX, (MAX_LAT - lat) * K];
const path = (pts: Array<[number, number]>) => pts.map(([la, ln], i) => `${i ? "L" : "M"}${project(la, ln).map((v) => v.toFixed(1)).join(" ")}`).join(" ") + "Z";
const W = Math.round((9.7 - MIN_LNG) * KX), H = Math.round((MAX_LAT - MIN_LAT) * K);

export default function FranceMap({ regions, locale, caption }: { regions: RegionNode[]; locale: string; caption: string }) {
  const nodes = regions
    .filter((r) => r.lat > MIN_LAT && r.lat < MAX_LAT)
    .sort((a, b) => b.count - a.count)
    .map((r, i) => { const [x, y] = project(r.lat, r.lng); return { ...r, x, y, r: 11 + Math.sqrt(r.count) * 2.4, i }; });

  return (
    <figure className="m-0 fr-map">
      <svg viewBox={`-10 -10 ${W + 20} ${H + 20}`} className="w-full h-auto" role="img" aria-label={caption}>
        <defs>
          <filter id="fr-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <pattern id="fr-grid" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="rgba(255,255,255,.14)" /></pattern>
        </defs>
        <path d={path(OUTLINE)} className="fr-land" />
        <path d={path(CORSICA)} className="fr-land" />
        <path d={path(OUTLINE)} className="fr-outline" />
        <path d={path(CORSICA)} className="fr-outline" />
        {nodes.map((n) => (
          <Link key={n.code} href={`/${locale}/carte?region=${n.code}`} className="fr-node" style={{ animationDelay: `${600 + n.i * 70}ms` }} aria-label={`${n.name} : ${n.count}`}>
            <circle cx={n.x} cy={n.y} r={n.r + 8} className="fr-halo" />
            <circle cx={n.x} cy={n.y} r={n.r} className="fr-bubble" />
            <text x={n.x} y={n.y + 4.5} textAnchor="middle" className="fr-count">{n.count}</text>
            <text x={n.x} y={n.y - n.r - 9} textAnchor="middle" className="fr-name">{n.name}</text>
          </Link>
        ))}
      </svg>
      <figcaption className="text-caption text-navy-300 text-center mt-2">{caption}</figcaption>
    </figure>
  );
}
