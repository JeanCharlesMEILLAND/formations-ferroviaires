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
      const icon =
        markerIcons[est.type.slug] || createMarkerIcon("#607D8B");

      const marker = L.marker([est.lat, est.lng], { icon });

      // Build popup HTML
      const formationsHtml = est.formations
        .slice(0, 5)
        .map(
          (ef) =>
            `<li style="font-size:11px;color:#344479;display:flex;align-items:flex-start;gap:6px;margin-bottom:4px;">
              <span style="width:6px;height:6px;border-radius:50%;background:${ef.formation.domain.color};margin-top:5px;flex-shrink:0;"></span>
              <span>${ef.formation.nameFr}${ef.formation.rncpCode ? ` <span style="color:#9EA6C0">(RNCP ${ef.formation.rncpCode})</span>` : ""}</span>
            </li>`
        )
        .join("");

      const moreHtml =
        est.formations.length > 5
          ? `<li style="font-size:11px;color:#00ACC1;font-weight:600;">+${est.formations.length - 5} ${dict.map.formations}...</li>`
          : "";

      const popupContent = `
        <div style="padding:16px;font-family:var(--font-inter),system-ui,sans-serif;">
          <div style="margin-bottom:8px;">
            <span style="display:inline-block;padding:2px 8px;border-radius:20px;color:white;font-size:10px;font-weight:500;background:${est.type.color};">
              ${locale === "fr" ? est.type.nameFr : est.type.nameEn}
            </span>
          </div>
          <h3 style="font-weight:700;color:#1B2A5B;font-size:15px;margin:0 0 4px;">${est.name}</h3>
          <p style="font-size:12px;color:#596794;margin:0 0 12px;">${est.city} — ${est.region.name}</p>
          ${
            est.formations.length > 0
              ? `<p style="font-size:12px;font-weight:600;color:#344479;margin:0 0 6px;">${dict.establishment.formations} :</p>
                 <ul style="list-style:none;padding:0;margin:0 0 12px;">${formationsHtml}${moreHtml}</ul>`
              : ""
          }
          <div style="display:flex;gap:8px;">
            <a href="/${locale}/etablissement/${est.slug}" style="font-size:11px;background:#1B2A5B;color:white;padding:6px 12px;border-radius:6px;text-decoration:none;font-weight:500;">${dict.map.seeDetails}</a>
            ${
              est.onisepUrl
                ? `<a href="${est.onisepUrl}" target="_blank" rel="noopener noreferrer" style="font-size:11px;border:1px solid #C5CAD9;color:#344479;padding:6px 12px;border-radius:6px;text-decoration:none;font-weight:500;">ONISEP</a>`
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

function createMarkerIcon(color: string): L.DivIcon {
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
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedMetier, setSelectedMetier] = useState("");
  const [selectedFormation, setSelectedFormation] = useState("");

  // Map control state
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [flyZoom, setFlyZoom] = useState(6);
  const [selectedEstablishment, setSelectedEstablishment] = useState<
    string | null
  >(null);

  // Sidebar view mode: establishments, formations, or metiers
  const [listView, setListView] = useState<"establishments" | "formations" | "metiers">("establishments");

  // Sidebar toggle for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const markerRefs = useRef<Record<string, L.Marker>>({});

  // Fetch filter data
  useEffect(() => {
    fetch("/api/filters")
      .then((r) => r.json())
      .then((data) => setFilterData(data))
      .catch(console.error);
  }, []);

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
        .then((r) => r.json())
        .then((data) => {
          setEstablishments(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }, searchQuery ? 300 : 0);

    return () => clearTimeout(timeout);
  }, [selectedType, selectedRegion, selectedDomain, selectedLevel, selectedMetier, selectedFormation, searchQuery]);

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

  const hasFilters =
    searchQuery || selectedType || selectedRegion || selectedDomain || selectedLevel || selectedMetier || selectedFormation;

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
          : `Filtres & Liste (${establishments.length})`}
      </button>

      {/* =============== SIDEBAR =============== */}
      <div
        className={`${
          sidebarOpen ? "flex" : "hidden"
        } lg:flex w-full lg:w-[400px] bg-white border-r border-navy-100 flex-col overflow-hidden rounded-l-card`}
        style={{ maxHeight: "100%", minHeight: 0 }}
      >
        {/* Filters */}
        <div className="p-4 border-b border-navy-100 space-y-3">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="8" cy="8" r="6" />
              <path d="M14 14l4 4" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={dict.map.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-card border border-navy-200 text-body-sm focus:outline-none focus:ring-2 focus:ring-electric-500 focus:border-transparent"
            />
          </div>

          {/* Métier & Formation dropdowns */}
          <div className="grid grid-cols-1 gap-2">
            <select
              value={selectedMetier}
              onChange={(e) => setSelectedMetier(e.target.value)}
              className="py-2 px-3 rounded-button border border-navy-200 text-caption bg-white focus:outline-none focus:ring-2 focus:ring-electric-500"
            >
              <option value="">{dict.map.allMetiers}</option>
              {Object.entries(metiersByFamily).map(([family, items]) => (
                <optgroup key={family} label={family}>
                  {items.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.nameFr}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <select
              value={selectedFormation}
              onChange={(e) => setSelectedFormation(e.target.value)}
              className="py-2 px-3 rounded-button border border-navy-200 text-caption bg-white focus:outline-none focus:ring-2 focus:ring-electric-500"
            >
              <option value="">{dict.map.allFormations}</option>
              {filterData?.formations.map((f) => (
                <option key={f.slug} value={f.slug}>
                  {f.nameFr}
                </option>
              ))}
            </select>
          </div>

          {/* Filter dropdowns */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="py-2 px-3 rounded-button border border-navy-200 text-caption bg-white focus:outline-none focus:ring-2 focus:ring-electric-500"
            >
              <option value="">{dict.map.allTypes}</option>
              {filterData?.types.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {locale === "fr" ? t.nameFr : t.nameEn}
                </option>
              ))}
            </select>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="py-2 px-3 rounded-button border border-navy-200 text-caption bg-white focus:outline-none focus:ring-2 focus:ring-electric-500"
            >
              <option value="">{dict.map.allRegions}</option>
              {filterData?.regions.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="py-2 px-3 rounded-button border border-navy-200 text-caption bg-white focus:outline-none focus:ring-2 focus:ring-electric-500"
            >
              <option value="">{dict.map.allDomains}</option>
              {filterData?.domains.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {locale === "fr" ? d.nameFr : d.nameEn}
                </option>
              ))}
            </select>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="py-2 px-3 rounded-button border border-navy-200 text-caption bg-white focus:outline-none focus:ring-2 focus:ring-electric-500"
            >
              <option value="">{dict.map.allLevels}</option>
              {filterData?.levels.map((l) => (
                <option key={l.slug} value={l.slug}>
                  {locale === "fr" ? l.nameFr : l.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Reset filters + List view toggle */}
          {hasFilters && (
            <div className="flex justify-end">
              <button
                onClick={resetFilters}
                className="text-caption text-electric-600 hover:text-electric-700 font-medium"
              >
                {dict.map.resetFilters}
              </button>
            </div>
          )}
          <div className="flex rounded-lg bg-navy-50 p-0.5 gap-0.5">
            {([
              { key: "establishments" as const, label: `Etablissements (${establishments.length})` },
              { key: "formations" as const, label: `Formations (${formationsInResults.length})` },
              { key: "metiers" as const, label: `Metiers (${metiersGrouped.length})` },
            ]).map((v) => (
              <button
                key={v.key}
                onClick={() => setListView(v.key)}
                className={`flex-1 py-1.5 rounded-md text-[10px] font-semibold transition-colors ${
                  listView === v.key
                    ? "bg-white text-navy-900 shadow-sm"
                    : "text-navy-400 hover:text-navy-600"
                }`}
              >
                {v.label}
              </button>
            ))}
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
            establishments.length === 0 ? (
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
              establishments.map((est) => (
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
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-white text-[10px] font-medium"
                          style={{ backgroundColor: est.type.color }}
                        >
                          {locale === "fr" ? est.type.nameFr : est.type.nameEn}
                        </span>
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
            establishments={establishments}
            markerIcons={markerIcons}
            locale={locale}
            dict={dict}
            onMarkerRef={handleMarkerRef}
          />
        </MapContainer>

        {/* Legend overlay */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-card p-3 shadow-card">
          <p className="text-[10px] font-heading font-semibold text-navy-700 mb-2">
            {dict.map.legend}
          </p>
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
      </div>
    </div>
  );
}
