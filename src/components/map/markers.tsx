"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import { FRANCE_BOUNDS, type Establishment } from "./types";

const CAP_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>`;

/** Pastille d'établissement : couleur du type, entrée animée, généralistes en petit point. */
export function createMarkerIcon(color: string, index: number, api = false): L.DivIcon {
  const delay = Math.min(index, 40) * 14;
  if (api) {
    return L.divIcon({
      className: "custom-marker",
      html: `<div class="pin api" style="background:${color};animation-delay:${delay}ms"></div>`,
      iconSize: [14, 14], iconAnchor: [7, 7],
    });
  }
  return L.divIcon({
    className: "custom-marker",
    html: `<div class="pin" style="background:${color};animation-delay:${delay}ms">${CAP_ICON}</div>`,
    iconSize: [32, 32], iconAnchor: [16, 16],
  });
}

function createClusterIcon(cluster: { getChildCount: () => number }): L.DivIcon {
  const n = cluster.getChildCount();
  const size = n < 10 ? 38 : n < 50 ? 46 : 56;
  const tone = n < 10 ? "sm" : n < 50 ? "md" : "lg";
  return L.divIcon({
    html: `<div class="cluster ${tone}" style="width:${size}px;height:${size}px">${n}</div>`,
    className: "custom-cluster",
    iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
}

type MarkerClusterGroupCtor = new (opts: Record<string, unknown>) => L.MarkerClusterGroup;

/** Couche de marqueurs groupés, pilotée impérativement (react-leaflet 4). */
export function MarkerClusterLayer({
  establishments,
  selectedId,
  hotId,
  onSelect,
}: {
  establishments: Establishment[];
  selectedId: string | null;
  hotId: string | null;
  onSelect: (est: Establishment) => void;
}) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!map) return;
    if (clusterRef.current) map.removeLayer(clusterRef.current);
    const Ctor = (L as unknown as { MarkerClusterGroup: MarkerClusterGroupCtor }).MarkerClusterGroup;
    const cluster = new Ctor({
      chunkedLoading: true,
      maxClusterRadius: 48,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: createClusterIcon,
      spiderLegPolylineOptions: { weight: 1.5, color: "#0C1F2C", opacity: 0.4 },
    });
    clusterRef.current = cluster;
    markersRef.current = {};

    establishments.forEach((est, i) => {
      const marker = L.marker([est.lat, est.lng], {
        icon: createMarkerIcon(est.type.color, i, est.source === "api"),
        title: est.name,
        riseOnHover: true,
      });
      marker.on("click", () => onSelectRef.current(est));
      markersRef.current[est.id] = marker;
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    return () => { map.removeLayer(cluster); };
  }, [map, establishments]);

  // Survol depuis la liste : la pastille grossit
  useEffect(() => {
    if (!hotId) return;
    const el = markersRef.current[hotId]?.getElement();
    el?.classList.add("is-hot");
    return () => el?.classList.remove("is-hot");
  }, [hotId]);

  // Sélection : après le vol de la carte, on dégroupe si besoin et on entoure la pastille
  useEffect(() => {
    if (!selectedId) return;
    const marker = markersRef.current[selectedId];
    const cluster = clusterRef.current;
    if (!marker || !cluster) return;
    let el: HTMLElement | undefined;
    const t = window.setTimeout(() => {
      (cluster as unknown as { zoomToShowLayer: (layer: L.Layer, cb: () => void) => void }).zoomToShowLayer(marker, () => {
        el = marker.getElement();
        el?.classList.add("is-selected");
      });
    }, 950);
    return () => { window.clearTimeout(t); (el ?? marker.getElement())?.classList.remove("is-selected"); };
  }, [selectedId, establishments]);

  return null;
}

/** Vol vers une position quand elle change (zoom conservé si non précisé). */
export function MapController({ target }: { target: { center: [number, number]; zoom?: number; tick: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo(target.center, target.zoom ?? map.getZoom(), { duration: 0.9 });
  }, [map, target]);
  return null;
}

/** Point bleu pulsé à la position du visiteur. */
export function UserDot({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (!position) return;
    const m = L.marker(position, {
      icon: L.divIcon({ className: "custom-marker", html: `<div class="user-dot"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] }),
      interactive: false,
      zIndexOffset: 1000,
    }).addTo(map);
    return () => { map.removeLayer(m); };
  }, [map, position]);
  return null;
}

/** Cadre la carte sur les résultats (un point : vol direct ; plusieurs : vol vers l'emprise). */
export function BoundsController({ target, desktop }: { target: { points: Array<[number, number]>; tick: number } | null; desktop: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!target || target.points.length === 0) return;
    if (target.points.length === 1) { map.flyTo(target.points[0], 12, { duration: 0.9 }); return; }
    const pad = overlayPadding(desktop);
    map.flyToBounds(L.latLngBounds(target.points), {
      paddingTopLeft: desktop ? [56, 56] : [36, pad.paddingTopLeft[1] + 8],
      paddingBottomRight: desktop ? [420, 56] : [36, pad.paddingBottomRight[1] + 8],
      maxZoom: 12,
      duration: 0.9,
    });
  }, [map, target, desktop]);
  return null;
}

/** Marges des surcouches : recherche et puces en haut, feuille en bas sur mobile ; fiche flottante à droite sur grand écran. */
export const overlayPadding = (desktop: boolean) => ({
  paddingTopLeft: (desktop ? [24, 24] : [8, 130]) as [number, number],
  paddingBottomRight: (desktop ? [24, 24] : [8, 108]) as [number, number],
});

/** Vue « toute la France » : au chargement sans animation, puis à chaque demande de recentrage. */
export function FranceView({ tick, desktop, active }: { tick: number; desktop: boolean; active: boolean }) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    if (!active && first.current) { first.current = false; return; }
    const bounds = L.latLngBounds(FRANCE_BOUNDS);
    const opts = overlayPadding(desktop);
    if (first.current) { first.current = false; map.fitBounds(bounds, { ...opts, animate: false }); return; }
    map.flyToBounds(bounds, { ...opts, duration: 0.9 });
  }, [map, tick, desktop, active]);
  return null;
}
