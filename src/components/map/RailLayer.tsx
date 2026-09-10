"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

/** Polylignes WGS84 produites par `scripts/build-france-map.ts` (lng, lat), `g` = ligne à grande vitesse. */
interface RailData { source: string; generated: string; lines: Array<{ l: string; g: 0 | 1; c: Array<[number, number]> }> }

const RAIL_URL = "/data/rfn-exploite.json";
const PANE = "rail";
const ATTRIBUTION = 'Réseau ferré © <a href="https://data.sncf.com/explore/dataset/formes-des-lignes-du-rfn/" target="_blank" rel="noopener">SNCF Réseau</a> (ODbL)';
export const RAIL_COLORS = { classic: "#12303F", lgv: "#FF5A36" };

let cache: Promise<RailData> | null = null;
function loadRail(): Promise<RailData> {
  if (!cache) cache = fetch(RAIL_URL).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<RailData>; }).catch((e) => { cache = null; throw e; });
  return cache;
}

/** Épaisseurs selon le zoom : discret à l'échelle nationale, lisible en ville. */
function weights(zoom: number) {
  const k = zoom >= 12 ? 1.8 : zoom >= 9 ? 1.4 : 1;
  return { classic: 1.1 * k, lgv: 2.2 * k };
}

/**
 * Réseau ferré national exploité sous les marqueurs : un calque dédié dessiné en canvas (18 000 points),
 * chargé après la carte, jamais interactif. Les LGV sont en corail, les autres lignes en pétrole.
 */
export default function RailLayer({ visible }: { visible: boolean }) {
  const map = useMap();
  const groups = useRef<{ classic: L.LayerGroup; lgv: L.LayerGroup } | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!map.getPane(PANE)) { const pane = map.createPane(PANE); pane.style.zIndex = "350"; pane.style.pointerEvents = "none"; }
    const renderer = L.canvas({ pane: PANE, padding: 0.5 });
    const classic = L.layerGroup(), lgv = L.layerGroup();
    groups.current = { classic, lgv };
    loadRail().then((data) => {
      if (cancelled) return;
      const w = weights(map.getZoom());
      for (const line of data.lines) {
        const latlngs = line.c.map(([lng, lat]) => [lat, lng] as [number, number]);
        const isLgv = line.g === 1;
        L.polyline(latlngs, {
          renderer, pane: PANE, interactive: false, smoothFactor: 1.2,
          color: isLgv ? RAIL_COLORS.lgv : RAIL_COLORS.classic, weight: isLgv ? w.lgv : w.classic, opacity: isLgv ? 0.8 : 0.55, lineCap: "round", lineJoin: "round",
        }).addTo(isLgv ? lgv : classic);
      }
      map.attributionControl?.addAttribution(ATTRIBUTION);
    }).catch(() => { /* sans réseau ferré, la carte reste utilisable */ });
    const onZoom = () => {
      const w = weights(map.getZoom());
      classic.eachLayer((l) => (l as L.Polyline).setStyle({ weight: w.classic }));
      lgv.eachLayer((l) => (l as L.Polyline).setStyle({ weight: w.lgv }));
    };
    map.on("zoomend", onZoom);
    return () => {
      cancelled = true;
      map.off("zoomend", onZoom);
      map.removeLayer(classic); map.removeLayer(lgv);
      map.attributionControl?.removeAttribution(ATTRIBUTION);
      groups.current = null;
    };
  }, [map]);

  useEffect(() => {
    const g = groups.current;
    if (!g) return;
    if (visible) { g.classic.addTo(map); g.lgv.addTo(map); } else { map.removeLayer(g.classic); map.removeLayer(g.lgv); }
  }, [map, visible]);

  return null;
}
