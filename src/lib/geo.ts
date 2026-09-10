/**
 * Outils géographiques sans dépendance : projection Lambert conforme conique (celle de la carte
 * de France de l'accueil), métrique locale, simplification de Douglas-Peucker, chemins SVG.
 * Utilisés par `scripts/build-france-map.ts` ; purs, donc testables (`tests/geo.test.ts`).
 */
export type LngLat = [number, number];
export type XY = [number, number];

const rad = (d: number) => (d * Math.PI) / 180;

/** Lambert conforme conique sécante (parallèles 44° et 49°, méridien central 3°, origine 46,5°) : la « France des cartes ». */
export function lambertProjector(opts: { parallels?: [number, number]; origin?: number; meridian?: number } = {}): (p: LngLat) => XY {
  const [p1, p2] = opts.parallels ?? [44, 49];
  const f1 = rad(p1), f2 = rad(p2), f0 = rad(opts.origin ?? 46.5), l0 = rad(opts.meridian ?? 3);
  const n = Math.log(Math.cos(f1) / Math.cos(f2)) / Math.log(Math.tan(Math.PI / 4 + f2 / 2) / Math.tan(Math.PI / 4 + f1 / 2));
  const F = (Math.cos(f1) * Math.pow(Math.tan(Math.PI / 4 + f1 / 2), n)) / n;
  const rho = (f: number) => F / Math.pow(Math.tan(Math.PI / 4 + f / 2), n);
  const rho0 = rho(f0);
  return ([lng, lat]) => {
    const r = rho(rad(lat)), t = n * (rad(lng) - l0);
    return [r * Math.sin(t), rho0 - r * Math.cos(t)];
  };
}

/** Métrique locale plate en mètres autour d'une latitude de référence : suffisante pour des tolérances de simplification. */
export function metersProjector(refLat = 46.6): (p: LngLat) => XY {
  const k = Math.cos(rad(refLat));
  return ([lng, lat]) => [lng * 111320 * k, lat * 110540];
}

/** Distance au carré d'un point à un segment. */
function sqDist(p: XY, a: XY, b: XY): number {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  const px = a[0] + t * dx - p[0], py = a[1] + t * dy - p[1];
  return px * px + py * py;
}

/** Douglas-Peucker itératif : garde les extrémités et tout point qui s'écarte de plus de `tolerance` (unité des coordonnées). */
export function simplifyLine<T extends XY>(points: T[], tolerance: number): T[] {
  if (points.length < 3) return points.slice();
  const keep = new Array<boolean>(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  const tol2 = tolerance * tolerance;
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let best = -1, bd = tol2;
    for (let i = a + 1; i < b; i++) {
      const d = sqDist(points[i], points[a], points[b]);
      if (d > bd) { bd = d; best = i; }
    }
    if (best > 0) { keep[best] = true; stack.push([a, best], [best, b]); }
  }
  return points.filter((_, i) => keep[i]);
}

/** Emprise d'un ensemble de points projetés. */
export function bounds(points: XY[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  return { minX, minY, maxX, maxY };
}

/** Chemin SVG « M x y L x y … » d'une polyligne, coordonnées arrondies. */
export function svgPath(points: XY[], decimals = 1, close = false): string {
  if (points.length === 0) return "";
  const s = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(decimals)} ${y.toFixed(decimals)}`).join("");
  return close ? `${s}Z` : s;
}
