#!/usr/bin/env tsx
/**
 * Génère la carte de France de l'accueil et le réseau ferré de la page carte, depuis les sources officielles :
 *   - contours des régions : gregoiredavid/france-geojson (licence ouverte) → src/components/home/france-regions.ts ;
 *   - réseau ferré national : SNCF Réseau, « formes des lignes du RFN » (ODbL), tronçons « Exploitée » ;
 *   - lignes à grande vitesse : SNCF Réseau, « vitesse maximale nominale sur ligne » (ODbL), v_max ≥ 250 km/h ;
 *     → src/components/home/france-rail.ts (chemins SVG projetés dans le cadre des régions, même Lambert)
 *     → public/data/rfn-exploite.json (polylignes WGS84 simplifiées à 100 m pour Leaflet).
 * Les téléchargements sont mis en cache dans scripts/cache/ (ignoré par Git). Sans réseau, le cache suffit.
 *   npx tsx scripts/build-france-map.ts
 */
import fs from "node:fs";
import path from "node:path";
import { bounds, lambertProjector, metersProjector, simplifyLine, svgPath, type LngLat, type XY } from "../src/lib/geo";

const ROOT = path.resolve(__dirname, "..");
const CACHE = path.join(ROOT, "scripts", "cache");
const SOURCES = {
  regions: "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions-version-simplifiee.geojson",
  rfn: "https://data.sncf.com/api/explore/v2.1/catalog/datasets/formes-des-lignes-du-rfn/exports/geojson",
  speed: "https://data.sncf.com/api/explore/v2.1/catalog/datasets/vitesse-maximale-nominale-sur-ligne/exports/geojson",
};
const INSEE: Record<string, string> = { "11": "IDF", "24": "CVL", "27": "BFC", "28": "NOR", "32": "HDF", "44": "GES", "52": "PDL", "53": "BRE", "75": "NAQ", "76": "OCC", "84": "ARA", "93": "PAC", "94": "COR" };
const HEIGHT = 600;          // hauteur du viewBox de la carte de l'accueil
const REGION_TOL_PX = 0.9;   // simplification des contours, en pixels du viewBox
const RAIL_HERO_TOL_PX = 0.5;
const RAIL_WEB_TOL_M = 100;  // simplification du réseau pour Leaflet, en mètres
const RAIL_WEB_DECIMALS = 4; // ≈ 11 m
const LGV_MIN_KMH = 250;

interface Feature { type: "Feature"; properties: Record<string, unknown>; geometry: { type: string; coordinates: unknown } }

async function load(name: keyof typeof SOURCES): Promise<{ features: Feature[] }> {
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, `${name}.geojson`);
  if (!fs.existsSync(file)) {
    process.stdout.write(`téléchargement ${name} … `);
    const res = await fetch(SOURCES[name]);
    if (!res.ok) throw new Error(`${SOURCES[name]} → HTTP ${res.status}`);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    console.log(`${(fs.statSync(file).size / 1024 / 1024).toFixed(1)} Mo`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const centroid = (ring: XY[]) => {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < ring.length - 1; i++) { const [x0, y0] = ring[i], [x1, y1] = ring[i + 1]; const c = x0 * y1 - x1 * y0; a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c; }
  a /= 2;
  return { area: Math.abs(a), cx: cx / (6 * a), cy: cy / (6 * a) };
};

async function main() {
  const [regions, rfn, speed] = await Promise.all([load("regions"), load("rfn"), load("speed")]);
  const lambert = lambertProjector();

  // 1. Régions : projection, cadrage sur leur emprise, simplification, centroïdes
  const feats = regions.features.filter((f) => INSEE[String(f.properties.code)]).map((f) => {
    const polys = (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) as LngLat[][][];
    return { code: INSEE[String(f.properties.code)], name: String(f.properties.nom), polys: polys.map((p) => p.map((ring) => ring.map(lambert))) };
  });
  const box = bounds(feats.flatMap((f) => f.polys.flatMap((p) => p.flat())));
  const S = HEIGHT / (box.maxY - box.minY), W = Math.round((box.maxX - box.minX) * S);
  const fit = ([x, y]: XY): XY => [(x - box.minX) * S, (box.maxY - y) * S];
  const shapes = feats.map((f) => {
    let d = "", big: ReturnType<typeof centroid> | null = null;
    for (const p of f.polys) {
      const c = centroid(p[0].map(fit));
      if (!big || c.area > big.area) big = c;
      for (const ring of p) { const s = simplifyLine(ring.map(fit), REGION_TOL_PX); if (s.length >= 4) d += svgPath(s, 1, true); }
    }
    return { code: f.code, name: f.name, d, cx: +big!.cx.toFixed(1), cy: +big!.cy.toFixed(1) };
  }).sort((a, b) => a.code.localeCompare(b.code));
  const regionsTs = `/** Régions métropolitaines : tracés simplifiés depuis le GeoJSON officiel (gregoiredavid/france-geojson, licence ouverte),
 * projetés en Lambert conforme conique (parallèles 44° et 49°, méridien 3°). Généré par \`scripts/build-france-map.ts\`, ne pas éditer à la main. */
export const FRANCE_VIEW = { w: ${W}, h: ${HEIGHT} };
export interface FranceRegionShape { code: string; name: string; d: string; cx: number; cy: number }
export const FRANCE_REGIONS: FranceRegionShape[] = ${JSON.stringify(shapes, null, 0).replace(/\},\{/g, "},\n{")};
`;
  fs.writeFileSync(path.join(ROOT, "src/components/home/france-regions.ts"), regionsTs);
  console.log(`régions : viewBox ${W}×${HEIGHT}, ${shapes.length} régions, ${Math.round(regionsTs.length / 1024)} Ko`);

  // 2. Réseau ferré : tronçons exploités, LGV = lignes dont un tronçon admet 250 km/h ou plus
  const lgv = new Set<string>();
  for (const f of speed.features) { const v = Number(f.properties.v_max); if (Number.isFinite(v) && v >= LGV_MIN_KMH) lgv.add(String(f.properties.code_ligne)); }
  const lines = rfn.features
    .filter((f) => f.properties.libelle === "Exploitée" && (f.geometry.type === "LineString" || f.geometry.type === "MultiLineString"))
    .flatMap((f) => (f.geometry.type === "LineString" ? [f.geometry.coordinates as LngLat[]] : (f.geometry.coordinates as LngLat[][])).map((c) => ({ code: String(f.properties.code_ligne), coords: c.map(([x, y]) => [x, y] as LngLat) })))
    .filter((l) => l.coords.length >= 2);
  const inputPoints = lines.reduce((n, l) => n + l.coords.length, 0);

  // 2a. Accueil : projeté dans le même cadre que les régions, simplifié en pixels
  const hero = { classic: "", lgv: "", points: 0 };
  for (const l of lines) {
    const s = simplifyLine(l.coords.map(lambert).map(fit), RAIL_HERO_TOL_PX);
    if (s.length < 2) continue;
    hero.points += s.length;
    if (lgv.has(l.code)) hero.lgv += svgPath(s, 1); else hero.classic += svgPath(s, 1);
  }
  const railTs = `/** Réseau ferré national exploité (SNCF Réseau, « formes des lignes du RFN », ODbL) et lignes à grande vitesse
 * (vitesse nominale ≥ ${LGV_MIN_KMH} km/h, SNCF Réseau), projetés dans le cadre de \`france-regions.ts\`.
 * Généré par \`scripts/build-france-map.ts\` le ${new Date().toISOString().slice(0, 10)}, ne pas éditer à la main. */
export const FRANCE_RAIL = {
  /** Lignes exploitées hors LGV */
  classic: ${JSON.stringify(hero.classic)},
  /** Lignes à grande vitesse */
  lgv: ${JSON.stringify(hero.lgv)},
};
`;
  fs.writeFileSync(path.join(ROOT, "src/components/home/france-rail.ts"), railTs);
  console.log(`réseau accueil : ${lines.length} tronçons exploités, ${lgv.size} codes LGV, ${hero.points} points, ${Math.round(railTs.length / 1024)} Ko`);

  // 2b. Page carte : WGS84 simplifié en métrique locale, arrondi
  const meters = metersProjector();
  const web = lines.map((l) => {
    const proj = l.coords.map((c) => ({ c, m: meters(c) }));
    const kept = simplifyLine(proj.map((p) => p.m), RAIL_WEB_TOL_M);
    const keep = new Set(kept.map((m) => `${m[0]},${m[1]}`));
    return { l: l.code, g: lgv.has(l.code) ? 1 : 0, c: proj.filter((p) => keep.has(`${p.m[0]},${p.m[1]}`)).map((p) => [+p.c[0].toFixed(RAIL_WEB_DECIMALS), +p.c[1].toFixed(RAIL_WEB_DECIMALS)]) };
  }).filter((l) => l.c.length >= 2);
  const webJson = JSON.stringify({
    source: "SNCF Réseau — formes des lignes du RFN (tronçons exploités) et vitesse maximale nominale (LGV ≥ 250 km/h), ODbL",
    generated: new Date().toISOString().slice(0, 10),
    tolerance_m: RAIL_WEB_TOL_M,
    lines: web,
  });
  fs.mkdirSync(path.join(ROOT, "public/data"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "public/data/rfn-exploite.json"), webJson);
  const webPoints = web.reduce((n, l) => n + l.c.length, 0);
  console.log(`réseau carte : ${web.length} polylignes, ${webPoints} points (${inputPoints} en entrée), ${Math.round(webJson.length / 1024)} Ko → public/data/rfn-exploite.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
