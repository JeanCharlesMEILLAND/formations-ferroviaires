"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";

// ============================================================
// Types matching our Prisma models
// ============================================================

interface EstablishmentType {
  id: string;
  slug: string;
  nameFr: string;
  nameEn: string;
  color: string;
}

interface Region {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
}

interface FormationLevel {
  id: string;
  slug: string;
  nameFr: string;
  nameEn: string;
  order: number;
}

interface FormationDomain {
  id: string;
  slug: string;
  nameFr: string;
  nameEn: string;
  color: string;
}

interface Formation {
  id: string;
  slug: string;
  nameFr: string;
  nameEn: string | null;
  rncpCode: string | null;
  onisepUrl: string | null;
  jobTarget: string | null;
  level: FormationLevel;
  domain: FormationDomain;
}

interface Establishment {
  id: string;
  slug: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  website: string | null;
  onisepUrl: string | null;
  source: string;
  type: EstablishmentType;
  region: Region;
  formations: Array<{ formation: Formation }>;
}

interface Metier {
  id: string;
  slug: string;
  nameFr: string;
  nameEn: string | null;
  family: string;
  source: string;
  level: string | null;
}

interface FormationOption {
  slug: string;
  nameFr: string;
  nameEn: string | null;
  level: { nameFr: string; nameEn: string; order: number };
}

interface MetierFormationLink {
  metier: { slug: string; nameFr: string; family: string };
  formation: { slug: string };
}

interface FilterData {
  regions: Region[];
  types: EstablishmentType[];
  levels: FormationLevel[];
  domains: FormationDomain[];
  metiers: Metier[];
  formations: FormationOption[];
  metierFormationLinks: MetierFormationLink[];
}

// ============================================================
// Utilitaires
// ============================================================

/** Échappe une valeur avant insertion dans le HTML d'une fenêtre (les noms peuvent venir d'un import externe). */
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Distance à vol d'oiseau en kilomètres. */
function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371, dLat = ((b[0] - a[0]) * Math.PI) / 180, dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Filtres reçus de l'adresse (page /carte?q=…&family=…), pour des recherches partageables. */
export interface InitialFilters {
  search?: string;
  metier?: string;
  formation?: string;
  region?: string;
  level?: string;
  domain?: string;
  type?: string;
  family?: string;
  near?: boolean;
  view?: "establishments" | "formations" | "metiers";
}

// ============================================================
// Map sub-components
// ============================================================

function MapController({
  center,
  zoom,
}: {
  center: [number, number] | null;
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1 });
    }
  }, [map, center, zoom]);
  return null;
}

// Marker cluster layer managed imperatively (react-leaflet v4 compatible)
function MarkerClusterLayer({
  establishments,
  markerIcons,
  locale,
  dict,
  onMarkerRef,
}: {
  establishments: Establishment[];
  markerIcons: Record<string, L.DivIcon>;
  locale: Locale;
  dict: Dictionary;
  onMarkerRef: (id: string, marker: L.Marker) => void;
}) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    // Remove old cluster
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    // Create new cluster group
    const cluster = (L as unknown as Record<string, unknown>).markerClusterGroup
      ? (L as unknown as { markerClusterGroup: (opts: Record<string, unknown>) => L.MarkerClusterGroup }).markerClusterGroup({
          chunkedLoading: true,
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
        })
      : new (L as unknown as { MarkerClusterGroup: new (opts: Record<string, unknown>) => L.MarkerClusterGroup }).MarkerClusterGroup({
          chunkedLoading: true,
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
        });

    clusterRef.current = cluster;

    establishments.forEach((est) => {
      const isApi = est.source === "api";
      const icon = isApi
        ? createMarkerIcon(est.type.color, true)
        : (markerIcons[est.type.slug] || createMarkerIcon("#607D8B"));

      const marker = L.marker([est.lat, est.lng], { icon });

      // Build popup HTML
      const formationsHtml = est.formations
        .slice(0, 5)
        .map(
          (ef) =>
            `<li style="font-size:11px;color:#3C4E5C;display:flex;align-items:flex-start;gap:6px;margin-bottom:4px;">
              <span style="width:6px;height:6px;border-radius:50%;background:${ef.formation.domain.color};margin-top:5px;flex-shrink:0;"></span>
              <span>${esc(ef.formation.nameFr)}${ef.formation.rncpCode ? ` <span style="color:#B7C6CE">(RNCP ${esc(ef.formation.rncpCode)})</span>` : ""}</span>
            </li>`
        )
        .join("");

      const moreHtml =
        est.formations.length > 5
          ? `<li style="font-size:11px;color:#E84A28;font-weight:600;">+${est.formations.length - 5} ${dict.map.formations}…</li>`
          : "";

      const popupContent = `
        <div style="padding:16px;font-family:var(--font-body),system-ui,sans-serif;">
          <div style="margin-bottom:8px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
            <span style="display:inline-block;padding:2px 8px;border-radius:20px;color:white;font-size:10px;font-weight:500;background:${est.type.color};">
              ${esc(locale === "fr" ? est.type.nameFr : est.type.nameEn)}
            </span>
            ${isApi ? `<span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:500;background:#FFF7D6;color:#7F5F06;border:1px solid #FFE47A;">Établissement généraliste</span>` : `<span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;background:#DDF3EA;color:#13634E;">Vérifié</span>`}
          </div>
          <h3 style="font-weight:700;color:#0C1F2C;font-size:15px;margin:0 0 4px;font-family:var(--font-heading),sans-serif;">${esc(est.name)}</h3>
          <p style="font-size:12px;color:#6C7C88;margin:0 0 12px;">${esc(est.city)} — ${esc(est.region.name)}</p>
          ${
            est.formations.length > 0
              ? `<p style="font-size:12px;font-weight:600;color:#3C4E5C;margin:0 0 6px;">${dict.establishment.formations} :</p>
                 <ul style="list-style:none;padding:0;margin:0 0 12px;">${formationsHtml}${moreHtml}</ul>`
              : ""
          }
          <div style="display:flex;gap:8px;">
            <a href="/${locale}/etablissement/${esc(est.slug)}" style="font-size:11px;background:#0C1F2C;color:white;padding:6px 12px;border-radius:999px;text-decoration:none;font-weight:600;">${dict.map.seeDetails}</a>
            ${
              est.onisepUrl
                ? `<a href="${esc(est.onisepUrl)}" target="_blank" rel="noopener noreferrer" style="font-size:11px;border:1px solid #D6DDE1;color:#3C4E5C;padding:6px 12px;border-radius:999px;text-decoration:none;font-weight:600;">ONISEP</a>`
                : ""
            }
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        minWidth: 280,
        maxWidth: 320,
        className: "formation-popup",
      });

      onMarkerRef(est.id, marker);
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
      }
    };
  }, [map, establishments, markerIcons, locale, dict, onMarkerRef]);

  return null;
}

// ============================================================
// Marker icon factory
// ============================================================

function createMarkerIcon(color: string, isApi = false): L.DivIcon {
  if (isApi) {
    return L.divIcon({
      className: "custom-marker",
      html: `<div style="background-color: ${color}; opacity: 0.6; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px dashed white; box-shadow: 0 1px 4px rgba(0,0,0,0.2);">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
          <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
        </svg>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  }
  return L.divIcon({
    className: "custom-marker",
    html: `<div class="establishment-marker" style="background-color: ${color}; width: 32px; height: 32px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
        <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

// ============================================================
// Main component
// ============================================================

export default function FormationsMap({
  dict,
  locale,
  initial,
}: {
  dict: Dictionary;
  locale: Locale;
  initial?: InitialFilters;
}) {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  // Filter state (initialisé depuis l'adresse pour des recherches partageables)
  const [searchQuery, setSearchQuery] = useState(initial?.search ?? "");
  const [selectedType, setSelectedType] = useState(initial?.type ?? "");
  const [selectedRegion, setSelectedRegion] = useState(initial?.region ?? "");
  const [selectedDomain, setSelectedDomain] = useState(initial?.domain ?? "");
  const [selectedLevel, setSelectedLevel] = useState(initial?.level ?? "");
  const [selectedMetier, setSelectedMetier] = useState(initial?.metier ?? "");
  const [selectedFormation, setSelectedFormation] = useState(initial?.formation ?? "");
  const [selectedFamily, setSelectedFamily] = useState(initial?.family ?? "");

  // Position du visiteur (« près de moi »)
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);

  // Map control state
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [flyZoom, setFlyZoom] = useState(6);
  const [selectedEstablishment, setSelectedEstablishment] = useState<
    string | null
  >(null);
  const [showLegend, setShowLegend] = useState(true);

  // Sidebar view mode: establishments, formations, or metiers
  const [listView, setListView] = useState<"establishments" | "formations" | "metiers">(initial?.view ?? "establishments");

  // Sidebar toggle for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const markerRefs = useRef<Record<string, L.Marker>>({});

  // Fetch filter data
  useEffect(() => {
    let cancelled = false;
    const load = async (attempt: number): Promise<void> => {
      try {
        const r = await fetch("/api/filters");
        const data = r.ok ? await r.json() : null;
        if (!data || !Array.isArray(data.types)) throw new Error("filtres indisponibles");
        if (!cancelled) { setFilterData(data); setLoadError(null); }
      } catch (err) {
        // La base se réveille en quelques secondes : on retente deux fois avant d'afficher un message.
        if (attempt < 3 && !cancelled) { await new Promise((res) => setTimeout(res, 2500)); return load(attempt + 1); }
        if (!cancelled) setLoadError(locale === "fr" ? "La base met quelques secondes à se réveiller." : "The database is waking up, give it a few seconds.");
        console.error(err);
      }
    };
    load(1);
    return () => { cancelled = true; };
  }, [locale, retryTick]);

  // Fetch establishments (debounced search)
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedType) params.set("type", selectedType);
    if (selectedRegion) params.set("region", selectedRegion);
    if (selectedDomain) params.set("domain", selectedDomain);
    if (selectedLevel) params.set("level", selectedLevel);
    if (selectedMetier) params.set("metier", selectedMetier);
    if (selectedFormation) params.set("formation", selectedFormation);
    if (searchQuery.length >= 2) params.set("search", searchQuery);

    const timeout = setTimeout(() => {
      fetch(`/api/establishments?${params.toString()}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((data) => {
          setEstablishments(Array.isArray(data) ? data : []);
          setLoadError(null);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setEstablishments([]);
          setLoadError(locale === "fr" ? "La base met quelques secondes à se réveiller." : "The database is waking up, give it a few seconds.");
          setLoading(false);
        });
    }, searchQuery ? 300 : 0);

    return () => clearTimeout(timeout);
  }, [selectedType, selectedRegion, selectedDomain, selectedLevel, selectedMetier, selectedFormation, searchQuery, locale, retryTick]);

  // « Près de moi » : géolocalisation, centrage et tri par distance
  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(p); setFlyTo(p); setFlyZoom(9); setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  }, []);

  useEffect(() => { if (initial?.near) locate(); }, [initial?.near, locate]);

  // Adresse à jour avec les filtres : une recherche se partage par son lien
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedMetier) params.set("metier", selectedMetier);
    if (selectedFormation) params.set("formation", selectedFormation);
    if (selectedRegion) params.set("region", selectedRegion);
    if (selectedLevel) params.set("level", selectedLevel);
    if (selectedDomain) params.set("domain", selectedDomain);
    if (selectedType) params.set("type", selectedType);
    if (selectedFamily) params.set("family", selectedFamily);
    if (listView !== "establishments") params.set("view", listView);
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [searchQuery, selectedMetier, selectedFormation, selectedRegion, selectedLevel, selectedDomain, selectedType, selectedFamily, listView]);

  // Marker icon cache
  const markerIcons = useMemo(() => {
    const icons: Record<string, L.DivIcon> = {};
    if (filterData) {
      for (const t of filterData.types) {
        icons[t.slug] = createMarkerIcon(t.color);
      }
    }
    return icons;
  }, [filterData]);

  const handleMarkerRef = useCallback((id: string, marker: L.Marker) => {
    markerRefs.current[id] = marker;
  }, []);

  const handleEstablishmentClick = useCallback((est: Establishment) => {
    setFlyTo([est.lat, est.lng]);
    setFlyZoom(13);
    setSelectedEstablishment(est.id);
    setSidebarOpen(false);

    // Open popup after fly animation
    setTimeout(() => {
      const marker = markerRefs.current[est.id];
      if (marker) marker.openPopup();
    }, 1200);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedType("");
    setSelectedRegion("");
    setSelectedDomain("");
    setSelectedLevel("");
    setSelectedMetier("");
    setSelectedFormation("");
    setSelectedFamily("");
    setUserPos(null);
    setFlyTo([46.6, 2.5]);
    setFlyZoom(6);
  }, []);

  // Group métiers by family for the dropdown
  const metiersByFamily = useMemo(() => {
    if (!filterData?.metiers) return {};
    const groups: Record<string, typeof filterData.metiers> = {};
    for (const m of filterData.metiers) {
      if (!groups[m.family]) groups[m.family] = [];
      groups[m.family].push(m);
    }
    return groups;
  }, [filterData]);

  // Build unique formations list from current establishments
  const formationsInResults = useMemo(() => {
    const map = new Map<string, { formation: Formation; count: number }>();
    establishments.forEach((est) => {
      est.formations.forEach((ef) => {
        const existing = map.get(ef.formation.id);
        if (existing) {
          existing.count++;
        } else {
          map.set(ef.formation.id, { formation: ef.formation, count: 1 });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => {
      const lo = a.formation.level.order - b.formation.level.order;
      if (lo !== 0) return lo;
      return a.formation.nameFr.localeCompare(b.formation.nameFr);
    });
  }, [establishments]);

  // Build unique métiers list from filterData
  const metiersGrouped = useMemo(() => {
    if (!filterData?.metiers) return [];
    return filterData.metiers;
  }, [filterData]);

  // Build métiers-by-formation index for showing badges
  const metiersByFormationSlug = useMemo(() => {
    if (!filterData?.metierFormationLinks) return {};
    const index: Record<string, Array<{ slug: string; nameFr: string; family: string }>> = {};
    for (const link of filterData.metierFormationLinks) {
      if (!index[link.formation.slug]) index[link.formation.slug] = [];
      index[link.formation.slug].push(link.metier);
    }
    return index;
  }, [filterData]);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showApiEstablishments, setShowApiEstablishments] = useState(false);

  // Formations menant aux métiers de la famille choisie (ex. « Conduite », ou « Commercial,Production »)
  const familyFormationSlugs = useMemo(() => {
    if (!selectedFamily || !filterData?.metierFormationLinks) return null;
    const families = new Set(selectedFamily.split(",").map((f) => f.trim()).filter(Boolean));
    const slugs = new Set<string>();
    for (const link of filterData.metierFormationLinks) {
      if (families.has(link.metier.family)) slugs.add(link.formation.slug);
    }
    return slugs;
  }, [selectedFamily, filterData]);

  // Généralistes masqués par défaut, filtre par famille, tri par distance si le visiteur est localisé
  const displayedEstablishments = useMemo(() => {
    let list = showApiEstablishments ? establishments : establishments.filter((e) => e.source !== "api");
    if (familyFormationSlugs) list = list.filter((e) => e.formations.some((ef) => familyFormationSlugs.has(ef.formation.slug)));
    if (userPos) list = [...list].sort((a, b) => distanceKm(userPos, [a.lat, a.lng]) - distanceKm(userPos, [b.lat, b.lng]));
    return list;
  }, [establishments, showApiEstablishments, familyFormationSlugs, userPos]);

  const apiCount = useMemo(() => establishments.filter(e => e.source === "api").length, [establishments]);

  const hasFilters =
    searchQuery || selectedType || selectedRegion || selectedDomain || selectedLevel || selectedMetier || selectedFormation || selectedFamily;

  const activeFilterCount = [selectedType, selectedRegion, selectedDomain, selectedLevel, selectedMetier, selectedFormation].filter(Boolean).length;

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-full min-h-0 overflow-hidden relative">
      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden flex items-center justify-center gap-2 bg-navy-900 text-white py-2.5 px-4 text-body-sm font-semibold rounded-t-card"
      >
        <svg
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 6h12M3 12h12" />
        </svg>
        {sidebarOpen
          ? "Voir la carte"
          : `Filtres & Liste (${displayedEstablishments.length})`}
      </button>

      {/* =============== SIDEBAR =============== */}
      <div
        className={`${
          sidebarOpen ? "flex" : "hidden"
        } lg:flex w-full lg:w-[400px] bg-white border-r border-navy-100 flex-col overflow-hidden rounded-l-card`}
        style={{ maxHeight: "100%", minHeight: 0 }}
      >
        {/* Filters */}
        <div className="border-b border-navy-100 bg-gradient-to-b from-navy-50/40 to-white">
          {/* Search */}
          <div className="px-4 pt-4 pb-2">
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="6.5" cy="6.5" r="5" /><path d="M11 11l3 3" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={dict.map.searchPlaceholder}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-navy-200 bg-white text-body-sm placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-electric-500 focus:border-transparent shadow-sm transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-navy-100 hover:bg-navy-200 flex items-center justify-center transition-colors">
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-navy-500"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>
          </div>

          {/* Près de moi, famille choisie, état de la base */}
          <div className="px-4 pb-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={locate}
              disabled={locating}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold border transition-colors ${userPos ? "bg-navy-900 text-white border-navy-900" : "bg-white text-navy-700 border-navy-200 hover:border-navy-900"} disabled:opacity-60`}
            >
              <span aria-hidden="true">◎</span> {locating ? "Localisation…" : userPos ? (locale === "fr" ? "Triés par distance" : "Sorted by distance") : dict.nav.near}
            </button>
            {selectedFamily && (
              <button type="button" onClick={() => setSelectedFamily("")} className="inline-flex items-center gap-1.5 rounded-full bg-signal-100 text-signal-800 border border-signal-300 px-3 py-1.5 text-[11px] font-bold" aria-label={`Retirer le filtre ${selectedFamily}`}>
                {selectedFamily.replace(",", " · ")} ✕
              </button>
            )}
            {userPos && (
              <button type="button" onClick={() => { setUserPos(null); setFlyTo([46.6, 2.5]); setFlyZoom(6); }} className="text-[11px] text-navy-400 underline">
                {locale === "fr" ? "Toute la France" : "All of France"}
              </button>
            )}
          </div>
          {loadError && (
            <div role="alert" className="mx-4 mb-2 rounded-xl border border-signal-300 bg-signal-50 px-3 py-2 text-[12px] text-navy-800 flex items-center justify-between gap-2">
              <span>{loadError}</span>
              <button type="button" onClick={() => { setLoadError(null); setRetryTick((t) => t + 1); }} className="font-bold underline whitespace-nowrap">{locale === "fr" ? "Réessayer" : "Retry"}</button>
            </div>
          )}

          {/* Primary filters: Metier & Formation */}
          <div className="px-4 pb-2 space-y-2">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center pointer-events-none">
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20" className="text-amber-600">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                </svg>
              </div>
              <select
                value={selectedMetier}
                onChange={(e) => setSelectedMetier(e.target.value)}
                className={`w-full py-2.5 pl-11 pr-8 rounded-xl border text-xs font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-electric-500 shadow-sm transition-all cursor-pointer ${
                  selectedMetier ? "border-amber-300 bg-amber-50 text-amber-800" : "border-navy-200 bg-white text-navy-600"
                }`}
              >
                <option value="">{dict.map.allMetiers}</option>
                {Object.entries(metiersByFamily).map(([family, items]) => (
                  <optgroup key={family} label={family}>
                    {items.map((m) => (
                      <option key={m.slug} value={m.slug}>{m.nameFr}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 pointer-events-none" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-electric-100 flex items-center justify-center pointer-events-none">
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-electric-600">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <select
                value={selectedFormation}
                onChange={(e) => setSelectedFormation(e.target.value)}
                className={`w-full py-2.5 pl-11 pr-8 rounded-xl border text-xs font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-electric-500 shadow-sm transition-all cursor-pointer ${
                  selectedFormation ? "border-electric-300 bg-electric-50 text-electric-800" : "border-navy-200 bg-white text-navy-600"
                }`}
              >
                <option value="">{dict.map.allFormations}</option>
                {filterData?.formations.map((f) => (
                  <option key={f.slug} value={f.slug}>{f.nameFr}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 pointer-events-none" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>

          {/* Advanced filters toggle */}
          <div className="px-4 pb-1">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`w-full flex items-center justify-between py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                showAdvancedFilters || activeFilterCount > 0
                  ? "bg-navy-100/60 text-navy-700"
                  : "hover:bg-navy-50 text-navy-400"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={activeFilterCount > 0 ? "text-electric-500" : ""}>
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
                </svg>
                Filtres avancés
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-electric-500 text-white text-[10px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={`transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
          </div>

          {/* Advanced filter dropdowns */}
          {showAdvancedFilters && (
            <div className="px-4 pb-2">
              <div className="grid grid-cols-2 gap-2 p-3 bg-navy-50/50 rounded-xl border border-navy-100">
                <div>
                  <label className="block text-[10px] font-bold text-navy-400 uppercase tracking-wider mb-1.5 ml-0.5">Type</label>
                  <div className="relative">
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className={`w-full py-2 pl-3 pr-7 rounded-lg border text-[11px] font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-electric-500 cursor-pointer ${
                        selectedType ? "border-blue-300 bg-blue-50 text-blue-700" : "border-navy-200 bg-white text-navy-600"
                      }`}
                    >
                      <option value="">{dict.map.allTypes}</option>
                      {filterData?.types.map((t) => (
                        <option key={t.slug} value={t.slug}>{locale === "fr" ? t.nameFr : t.nameEn}</option>
                      ))}
                    </select>
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-300 pointer-events-none" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-navy-400 uppercase tracking-wider mb-1.5 ml-0.5">Region</label>
                  <div className="relative">
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className={`w-full py-2 pl-3 pr-7 rounded-lg border text-[11px] font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-electric-500 cursor-pointer ${
                        selectedRegion ? "border-green-300 bg-green-50 text-green-700" : "border-navy-200 bg-white text-navy-600"
                      }`}
                    >
                      <option value="">{dict.map.allRegions}</option>
                      {filterData?.regions.map((r) => (
                        <option key={r.code} value={r.code}>{r.name}</option>
                      ))}
                    </select>
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-300 pointer-events-none" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-navy-400 uppercase tracking-wider mb-1.5 ml-0.5">Domaine</label>
                  <div className="relative">
                    <select
                      value={selectedDomain}
                      onChange={(e) => setSelectedDomain(e.target.value)}
                      className={`w-full py-2 pl-3 pr-7 rounded-lg border text-[11px] font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-electric-500 cursor-pointer ${
                        selectedDomain ? "border-purple-300 bg-purple-50 text-purple-700" : "border-navy-200 bg-white text-navy-600"
                      }`}
                    >
                      <option value="">{dict.map.allDomains}</option>
                      {filterData?.domains.map((d) => (
                        <option key={d.slug} value={d.slug}>{locale === "fr" ? d.nameFr : d.nameEn}</option>
                      ))}
                    </select>
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-300 pointer-events-none" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-navy-400 uppercase tracking-wider mb-1.5 ml-0.5">Niveau</label>
                  <div className="relative">
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className={`w-full py-2 pl-3 pr-7 rounded-lg border text-[11px] font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-electric-500 cursor-pointer ${
                        selectedLevel ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-navy-200 bg-white text-navy-600"
                      }`}
                    >
                      <option value="">{dict.map.allLevels}</option>
                      {filterData?.levels.map((l) => (
                        <option key={l.slug} value={l.slug}>{locale === "fr" ? l.nameFr : l.nameEn}</option>
                      ))}
                    </select>
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-300 pointer-events-none" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active filters pills + reset */}
          {hasFilters && (
            <div className="px-4 py-2.5 flex items-center gap-1.5 flex-wrap bg-white/60">
              {selectedMetier && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] text-amber-700 font-semibold">
                  {filterData?.metiers.find(m => m.slug === selectedMetier)?.nameFr}
                  <button onClick={() => setSelectedMetier("")} className="ml-0.5 hover:text-red-500 transition-colors"><svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                </span>
              )}
              {selectedFormation && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-electric-50 border border-electric-200 text-[10px] text-electric-700 font-semibold">
                  {filterData?.formations.find(f => f.slug === selectedFormation)?.nameFr}
                  <button onClick={() => setSelectedFormation("")} className="ml-0.5 hover:text-red-500 transition-colors"><svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                </span>
              )}
              {selectedType && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[10px] text-blue-700 font-semibold">
                  {filterData?.types.find(t => t.slug === selectedType)?.[locale === "fr" ? "nameFr" : "nameEn"]}
                  <button onClick={() => setSelectedType("")} className="ml-0.5 hover:text-red-500 transition-colors"><svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                </span>
              )}
              {selectedRegion && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-[10px] text-green-700 font-semibold">
                  {filterData?.regions.find(r => r.code === selectedRegion)?.name}
                  <button onClick={() => setSelectedRegion("")} className="ml-0.5 hover:text-red-500 transition-colors"><svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                </span>
              )}
              {selectedDomain && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-[10px] text-purple-700 font-semibold">
                  {filterData?.domains.find(d => d.slug === selectedDomain)?.[locale === "fr" ? "nameFr" : "nameEn"]}
                  <button onClick={() => setSelectedDomain("")} className="ml-0.5 hover:text-red-500 transition-colors"><svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                </span>
              )}
              {selectedLevel && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[10px] text-indigo-700 font-semibold">
                  {filterData?.levels.find(l => l.slug === selectedLevel)?.[locale === "fr" ? "nameFr" : "nameEn"]}
                  <button onClick={() => setSelectedLevel("")} className="ml-0.5 hover:text-red-500 transition-colors"><svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                </span>
              )}
              <button
                onClick={resetFilters}
                className="ml-auto text-[10px] text-red-500 hover:text-red-600 font-bold flex items-center gap-1 shrink-0 px-2 py-1 rounded-full hover:bg-red-50 transition-colors"
              >
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                Effacer
              </button>
            </div>
          )}

          {/* View mode toggle */}
          <div className="px-4 py-3">
            <div className="flex rounded-xl bg-navy-900/5 p-1 gap-1">
              {([
                { key: "establishments" as const, label: "Établissements", count: displayedEstablishments.length, color: "bg-navy-900" },
                { key: "formations" as const, label: "Formations", count: formationsInResults.length, color: "bg-electric-500" },
                { key: "metiers" as const, label: "Métiers", count: metiersGrouped.length, color: "bg-signal-500" },
              ]).map((v) => (
                <button
                  key={v.key}
                  onClick={() => setListView(v.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[11px] font-bold transition-all ${
                    listView === v.key
                      ? "bg-white text-navy-900 shadow-md"
                      : "text-navy-400 hover:text-navy-600 hover:bg-white/40"
                  }`}
                >
                  <span>{v.label}</span>
                  <span className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[10px] font-bold ${
                    listView === v.key ? `${v.color} text-white` : "bg-navy-100 text-navy-500"
                  }`}>{v.count}</span>
                </button>
              ))}
            </div>
            {/* Passerelle toggle */}
            {apiCount > 0 && (
              <button
                onClick={() => setShowApiEstablishments(!showApiEstablishments)}
                className={`mt-2 w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${
                  showApiEstablishments
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-navy-50 text-navy-400 border border-navy-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full border-2 border-dashed ${showApiEstablishments ? "bg-amber-400 border-amber-600" : "bg-navy-200 border-navy-300"}`} />
                  {locale === "fr" ? "Établissements généralistes" : "Generalist institutions"} ({apiCount})
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${showApiEstablishments ? "bg-amber-200 text-amber-800" : "bg-navy-100 text-navy-400"}`}>
                  {showApiEstablishments ? "ON" : "OFF"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-navy-400">
              <svg
                className="animate-spin h-6 w-6 mr-2"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {dict.common.loading}
            </div>
          ) : listView === "establishments" ? (
            /* === ESTABLISHMENTS LIST === */
            displayedEstablishments.length === 0 ? (
              <div className="text-center py-16 px-4">
                <p className="text-navy-400 text-body-sm mb-3">
                  {dict.map.noResults}
                </p>
                <button
                  onClick={resetFilters}
                  className="text-electric-600 hover:text-electric-700 text-body-sm font-medium"
                >
                  {dict.map.resetFilters}
                </button>
              </div>
            ) : (
              displayedEstablishments.map((est) => (
                <button
                  key={est.id}
                  onClick={() => handleEstablishmentClick(est)}
                  className={`w-full text-left p-4 border-b border-navy-50 hover:bg-navy-50/50 transition-colors ${
                    selectedEstablishment === est.id
                      ? "bg-electric-50 border-l-4 border-l-electric-500"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: est.type.color }}
                    />
                    <div className="min-w-0">
                      <h3 className="font-heading font-semibold text-body-sm text-navy-900 truncate">
                        {est.name}
                      </h3>
                      <p className="text-caption text-navy-400 mt-0.5">
                        {est.city} — {est.region.name}
                        {userPos && <span className="font-bold text-navy-700"> · {Math.round(distanceKm(userPos, [est.lat, est.lng]))} km</span>}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-white text-[10px] font-medium"
                          style={{ backgroundColor: est.type.color }}
                        >
                          {locale === "fr" ? est.type.nameFr : est.type.nameEn}
                        </span>
                        {est.source === "api" && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            {locale === "fr" ? "Généraliste" : "Generalist"}
                          </span>
                        )}
                        <span className="text-[10px] text-navy-400 py-0.5">
                          {est.formations.length}{" "}
                          {est.formations.length <= 1
                            ? dict.map.formation
                            : dict.map.formations}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )
          ) : listView === "formations" ? (
            /* === FORMATIONS LIST === */
            formationsInResults.length === 0 ? (
              <div className="text-center py-16 px-4">
                <p className="text-navy-400 text-body-sm">Aucune formation</p>
              </div>
            ) : (
              formationsInResults.map(({ formation: f, count }) => {
                const linkedMetiers = metiersByFormationSlug[f.slug] || [];
                return (
                <div
                  key={f.id}
                  className={`w-full text-left p-4 border-b border-navy-50 transition-colors ${
                    selectedFormation === f.slug
                      ? "bg-electric-50 border-l-4 border-l-electric-500"
                      : ""
                  }`}
                >
                  <button
                    onClick={() => {
                      setSelectedFormation(f.slug);
                      setListView("establishments");
                    }}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: f.domain.color }}
                      />
                      <div className="min-w-0">
                        <h3 className="font-heading font-semibold text-body-sm text-navy-900">
                          {f.nameFr}
                        </h3>
                        {f.rncpCode && (
                          <p className="text-[10px] text-navy-300 mt-0.5">
                            RNCP {f.rncpCode}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-white text-[10px] font-medium"
                            style={{ backgroundColor: f.domain.color }}
                          >
                            {locale === "fr" ? f.domain.nameFr : f.domain.nameEn}
                          </span>
                          <span className="inline-block px-2 py-0.5 rounded-full bg-navy-100 text-navy-600 text-[10px] font-medium">
                            {locale === "fr" ? f.level.nameFr : f.level.nameEn}
                          </span>
                          <span className="text-[10px] text-navy-400 py-0.5">
                            {count} {count <= 1 ? "etablissement" : "etablissements"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                  {/* Métier badges */}
                  {linkedMetiers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5 ml-6">
                      {linkedMetiers.slice(0, 3).map((m) => (
                        <button
                          key={m.slug}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMetier(m.slug);
                            setListView("establishments");
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] text-amber-800 font-medium hover:bg-amber-100 transition-colors"
                          title={`Fiche metier : ${m.nameFr}`}
                        >
                          <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/></svg>
                          {m.nameFr.length > 30 ? m.nameFr.slice(0, 28) + "..." : m.nameFr}
                        </button>
                      ))}
                      {linkedMetiers.length > 3 && (
                        <span className="text-[10px] text-amber-600 py-0.5">+{linkedMetiers.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
                );
              })
            )
          ) : (
            /* === METIERS LIST === */
            metiersGrouped.length === 0 ? (
              <div className="text-center py-16 px-4">
                <p className="text-navy-400 text-body-sm">Aucun metier</p>
              </div>
            ) : (
              (() => {
                const grouped: Record<string, Metier[]> = {};
                metiersGrouped.forEach((m) => {
                  if (!grouped[m.family]) grouped[m.family] = [];
                  grouped[m.family].push(m);
                });
                return Object.entries(grouped).map(([family, items]) => (
                  <div key={family}>
                    <div className="px-4 py-2 bg-navy-50 text-[10px] font-bold text-navy-500 uppercase tracking-wider sticky top-0">
                      {family}
                    </div>
                    {items.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedMetier(m.slug);
                          setListView("establishments");
                        }}
                        className={`w-full text-left p-4 border-b border-navy-50 hover:bg-navy-50/50 transition-colors ${
                          selectedMetier === m.slug
                            ? "bg-electric-50 border-l-4 border-l-electric-500"
                            : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <h3 className="font-heading font-semibold text-body-sm text-navy-900">
                            {m.nameFr}
                          </h3>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            <span className="inline-block px-2 py-0.5 rounded-full bg-navy-100 text-navy-600 text-[10px] font-medium">
                              {m.level || "-"}
                            </span>
                            <span className="text-[10px] text-navy-300">
                              {m.source}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ));
              })()
            )
          )}
        </div>
      </div>

      {/* =============== MAP =============== */}
      <div className={`flex-1 ${sidebarOpen ? "hidden lg:block" : "block"}`}>
        <MapContainer
          center={[46.6, 2.5]}
          zoom={6}
          className="w-full h-full rounded-none lg:rounded-r-card"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={flyTo} zoom={flyZoom} />
          <MarkerClusterLayer
            establishments={displayedEstablishments}
            markerIcons={markerIcons}
            locale={locale}
            dict={dict}
            onMarkerRef={handleMarkerRef}
          />
        </MapContainer>

        {/* Legend overlay */}
        {showLegend ? (
          <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-card p-3 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-heading font-semibold text-navy-700">
                {dict.map.legend}
              </p>
              <button
                onClick={() => setShowLegend(false)}
                className="text-navy-400 hover:text-navy-700 transition-colors ml-3"
                aria-label="Fermer la légende"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3l8 8M11 3l-8 8" />
                </svg>
              </button>
            </div>
            <div className="space-y-1">
              {filterData?.types.map((t) => (
                <div key={t.slug} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="text-[10px] text-navy-600">
                    {locale === "fr" ? t.nameFr : t.nameEn}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowLegend(true)}
            className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-card p-2.5 shadow-card text-navy-600 hover:text-navy-800 transition-colors"
            aria-label="Afficher la légende"
            title={dict.map.legend}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="4" cy="4" r="2" /><line x1="8" y1="4" x2="14" y2="4" />
              <circle cx="4" cy="8" r="2" /><line x1="8" y1="8" x2="14" y2="8" />
              <circle cx="4" cy="12" r="2" /><line x1="8" y1="12" x2="14" y2="12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
