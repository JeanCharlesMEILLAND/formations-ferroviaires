"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { displayName } from "@/lib/format";
import SearchField from "./SearchField";
import EstablishmentCard from "./EstablishmentCard";
import { MarkerClusterLayer, MapController, UserDot } from "./markers";
import { useCountUp, useDesktop } from "./hooks";
import { distanceKm, FRANCE_CENTER, FRANCE_ZOOM, type Establishment, type FilterData, type Formation, type Metier } from "./types";

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

type View = "establishments" | "formations" | "metiers";
type Sheet = "peek" | "half" | "full";
type FlyTarget = { center: [number, number]; zoom?: number; tick: number };

const PEEK = 92; // hauteur visible de la feuille repliée (mobile)

export default function FormationsMap({ dict, locale, initial }: { dict: Dictionary; locale: Locale; initial?: InitialFilters }) {
  const m = dict.map;
  const fr = locale === "fr";
  const desktop = useDesktop();

  // ------------------------------------------------------------------ données
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  // ------------------------------------------------------------------ filtres
  const [searchQuery, setSearchQuery] = useState(initial?.search ?? "");
  const [selectedType, setSelectedType] = useState(initial?.type ?? "");
  const [selectedRegion, setSelectedRegion] = useState(initial?.region ?? "");
  const [selectedDomain, setSelectedDomain] = useState(initial?.domain ?? "");
  const [selectedLevel, setSelectedLevel] = useState(initial?.level ?? "");
  const [selectedMetier, setSelectedMetier] = useState(initial?.metier ?? "");
  const [selectedFormation, setSelectedFormation] = useState(initial?.formation ?? "");
  const [selectedFamily, setSelectedFamily] = useState(initial?.family ?? "");
  const [showApi, setShowApi] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(Boolean(initial?.type || initial?.region || initial?.level || initial?.domain || initial?.metier || initial?.formation));

  // ------------------------------------------------------------------ carte et sélection
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [fly, setFly] = useState<FlyTarget | null>(null);
  const [selected, setSelected] = useState<Establishment | null>(null);
  const [hotId, setHotId] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [view, setView] = useState<View>(initial?.view ?? "establishments");
  const [sheet, setSheet] = useState<Sheet>("peek");
  const listRef = useRef<HTMLDivElement>(null);

  const flyTo = useCallback((center: [number, number], zoom?: number) => setFly({ center, zoom, tick: Date.now() }), []);

  // Référentiels (deux nouvelles tentatives : la base gratuite se réveille en quelques secondes)
  useEffect(() => {
    let cancelled = false;
    const load = async (attempt: number): Promise<void> => {
      try {
        const r = await fetch("/api/filters");
        const data = r.ok ? await r.json() : null;
        if (!data || !Array.isArray(data.types)) throw new Error("filtres indisponibles");
        if (!cancelled) { setFilterData(data); setLoadError(null); }
      } catch (err) {
        if (attempt < 3 && !cancelled) { await new Promise((res) => setTimeout(res, 2500)); return load(attempt + 1); }
        if (!cancelled) setLoadError(m.dbWaking);
        console.error(err);
      }
    };
    load(1);
    return () => { cancelled = true; };
  }, [m.dbWaking, retryTick]);

  // Établissements (recherche différée de 300 ms)
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedType) params.set("type", selectedType);
    if (selectedRegion) params.set("region", selectedRegion);
    if (selectedDomain) params.set("domain", selectedDomain);
    if (selectedLevel) params.set("level", selectedLevel);
    if (selectedMetier) params.set("metier", selectedMetier);
    if (selectedFormation) params.set("formation", selectedFormation);
    if (searchQuery.trim().length >= 2) params.set("search", searchQuery.trim());
    const timeout = setTimeout(() => {
      fetch(`/api/establishments?${params.toString()}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((data) => { setEstablishments(Array.isArray(data) ? data : []); setLoadError(null); setLoading(false); })
        .catch((err) => { console.error(err); setEstablishments([]); setLoadError(m.dbWaking); setLoading(false); });
    }, searchQuery ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [selectedType, selectedRegion, selectedDomain, selectedLevel, selectedMetier, selectedFormation, searchQuery, m.dbWaking, retryTick]);

  // « Près de moi »
  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { const p: [number, number] = [pos.coords.latitude, pos.coords.longitude]; setUserPos(p); flyTo(p, 9); setLocating(false); },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  }, [flyTo]);
  useEffect(() => { if (initial?.near) locate(); }, [initial?.near, locate]);

  // Adresse à jour : une recherche se partage par son lien
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedMetier) params.set("metier", selectedMetier);
    if (selectedFormation) params.set("formation", selectedFormation);
    if (selectedRegion) params.set("region", selectedRegion);
    if (selectedLevel) params.set("level", selectedLevel);
    if (selectedDomain) params.set("domain", selectedDomain);
    if (selectedType) params.set("type", selectedType);
    if (selectedFamily) params.set("family", selectedFamily);
    if (view !== "establishments") params.set("view", view);
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [searchQuery, selectedMetier, selectedFormation, selectedRegion, selectedLevel, selectedDomain, selectedType, selectedFamily, view]);

  // ------------------------------------------------------------------ dérivés
  const families = useMemo(() => {
    const count = new Map<string, number>();
    for (const mt of filterData?.metiers ?? []) count.set(mt.family, (count.get(mt.family) ?? 0) + 1);
    return Array.from(count.entries()).sort((a, b) => b[1] - a[1]).map(([f]) => f);
  }, [filterData]);

  const familyFormationSlugs = useMemo(() => {
    if (!selectedFamily || !filterData) return null;
    const wanted = new Set(selectedFamily.split(",").map((f) => f.trim()).filter(Boolean));
    const slugs = new Set<string>();
    for (const link of filterData.metierFormationLinks) if (wanted.has(link.metier.family)) slugs.add(link.formation.slug);
    return slugs;
  }, [selectedFamily, filterData]);

  const displayed = useMemo(() => {
    let list = showApi ? establishments : establishments.filter((e) => e.source !== "api");
    if (familyFormationSlugs) list = list.filter((e) => e.formations.some((ef) => familyFormationSlugs.has(ef.formation.slug)));
    if (userPos) list = [...list].sort((a, b) => distanceKm(userPos, [a.lat, a.lng]) - distanceKm(userPos, [b.lat, b.lng]));
    return list;
  }, [establishments, showApi, familyFormationSlugs, userPos]);

  const apiCount = useMemo(() => establishments.filter((e) => e.source === "api").length, [establishments]);
  const verifiedCount = useMemo(() => displayed.filter((e) => e.source !== "api").length, [displayed]);

  const formationsInResults = useMemo(() => {
    const map = new Map<string, { formation: Formation; count: number }>();
    for (const est of displayed) for (const ef of est.formations) {
      const x = map.get(ef.formation.id);
      if (x) x.count += 1; else map.set(ef.formation.id, { formation: ef.formation, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => a.formation.level.order - b.formation.level.order || a.formation.nameFr.localeCompare(b.formation.nameFr));
  }, [displayed]);

  const metiersByFormationSlug = useMemo(() => {
    const index: Record<string, Array<{ slug: string; nameFr: string; family: string }>> = {};
    for (const link of filterData?.metierFormationLinks ?? []) (index[link.formation.slug] ??= []).push(link.metier);
    return index;
  }, [filterData]);

  const metiersInResults = useMemo(() => {
    if (!filterData) return [] as Metier[];
    const slugs = new Set<string>();
    for (const { formation } of formationsInResults) for (const mt of metiersByFormationSlug[formation.slug] ?? []) slugs.add(mt.slug);
    const list = slugs.size ? filterData.metiers.filter((mt) => slugs.has(mt.slug)) : filterData.metiers;
    return [...list].sort((a, b) => a.family.localeCompare(b.family) || a.nameFr.localeCompare(b.nameFr));
  }, [filterData, formationsInResults, metiersByFormationSlug]);

  const metiersByFamily = useMemo(() => {
    const groups: Record<string, Metier[]> = {};
    for (const mt of filterData?.metiers ?? []) (groups[mt.family] ??= []).push(mt);
    return groups;
  }, [filterData]);

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; clear: () => void }> = [];
    const f = filterData;
    if (selectedMetier) chips.push({ key: "metier", label: f?.metiers.find((x) => x.slug === selectedMetier)?.nameFr ?? selectedMetier, clear: () => setSelectedMetier("") });
    if (selectedFormation) chips.push({ key: "formation", label: f?.formations.find((x) => x.slug === selectedFormation)?.nameFr ?? selectedFormation, clear: () => setSelectedFormation("") });
    if (selectedRegion) chips.push({ key: "region", label: f?.regions.find((x) => x.code === selectedRegion)?.name ?? selectedRegion, clear: () => setSelectedRegion("") });
    if (selectedLevel) chips.push({ key: "level", label: (fr ? f?.levels.find((x) => x.slug === selectedLevel)?.nameFr : f?.levels.find((x) => x.slug === selectedLevel)?.nameEn) ?? selectedLevel, clear: () => setSelectedLevel("") });
    if (selectedDomain) chips.push({ key: "domain", label: (fr ? f?.domains.find((x) => x.slug === selectedDomain)?.nameFr : f?.domains.find((x) => x.slug === selectedDomain)?.nameEn) ?? selectedDomain, clear: () => setSelectedDomain("") });
    if (selectedType) chips.push({ key: "type", label: (fr ? f?.types.find((x) => x.slug === selectedType)?.nameFr : f?.types.find((x) => x.slug === selectedType)?.nameEn) ?? selectedType, clear: () => setSelectedType("") });
    return chips;
  }, [filterData, fr, selectedMetier, selectedFormation, selectedRegion, selectedLevel, selectedDomain, selectedType]);

  const hasFilters = Boolean(searchQuery || selectedFamily || activeChips.length);
  const count = useCountUp(displayed.length);

  // ------------------------------------------------------------------ actions
  const resetFilters = useCallback(() => {
    setSearchQuery(""); setSelectedType(""); setSelectedRegion(""); setSelectedDomain(""); setSelectedLevel("");
    setSelectedMetier(""); setSelectedFormation(""); setSelectedFamily(""); setUserPos(null); setSelected(null);
    flyTo(FRANCE_CENTER, FRANCE_ZOOM);
  }, [flyTo]);

  const select = useCallback((est: Establishment, zoom?: number) => {
    setSelected(est);
    flyTo([est.lat, est.lng], zoom);
    if (!desktop) setSheet("peek");
  }, [flyTo, desktop]);

  const pickFormation = (slug: string) => { setSelectedFormation(slug); setView("establishments"); listRef.current?.scrollTo({ top: 0 }); };
  const pickMetier = (slug: string) => { setSelectedMetier(slug); setView("establishments"); listRef.current?.scrollTo({ top: 0 }); };

  // Feuille mobile : glisser la poignée
  const drag = useRef<{ startY: number; startOffset: number; height: number; moved: boolean } | null>(null);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [sheetH, setSheetH] = useState(0);
  useEffect(() => {
    const el = sheetRef.current;
    if (!el || desktop) return;
    const ro = new ResizeObserver(() => setSheetH(el.offsetHeight));
    ro.observe(el);
    setSheetH(el.offsetHeight);
    return () => ro.disconnect();
  }, [desktop]);
  const offsetFor = (s: Sheet, h: number) => (s === "full" ? 0 : s === "half" ? Math.round(h * 0.5) : h - PEEK);
  const onHandleDown = (e: React.PointerEvent) => {
    const h = sheetRef.current?.offsetHeight ?? 0;
    drag.current = { startY: e.clientY, startOffset: offsetFor(sheet, h), height: h, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onHandleMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dy = e.clientY - drag.current.startY;
    if (Math.abs(dy) > 4) drag.current.moved = true;
    setDragOffset(Math.max(0, Math.min(drag.current.height - PEEK, drag.current.startOffset + dy)));
  };
  const onHandleUp = () => {
    const d = drag.current; drag.current = null;
    if (!d) return;
    if (!d.moved) { setSheet(sheet === "peek" ? "half" : "peek"); setDragOffset(null); return; }
    const off = dragOffset ?? d.startOffset;
    const candidates: Array<[Sheet, number]> = [["full", 0], ["half", offsetFor("half", d.height)], ["peek", d.height - PEEK]];
    candidates.sort((a, b) => Math.abs(a[1] - off) - Math.abs(b[1] - off));
    setSheet(candidates[0][0]);
    setDragOffset(null);
  };
  const sheetStyle = desktop ? undefined : sheetH === 0 ? { transform: `translateY(calc(100% - ${PEEK}px))` } : {
    transform: `translateY(${dragOffset ?? offsetFor(sheet, sheetH)}px)`,
    transition: dragOffset === null ? "transform .38s cubic-bezier(.2,.8,.2,1)" : "none",
  };

  // ------------------------------------------------------------------ rendu : blocs réutilisés
  const selectClass = (active: boolean) => `w-full h-10 pl-3 pr-8 rounded-xl border text-[13px] font-semibold appearance-none focus:outline-none focus:ring-4 focus:ring-navy-900/10 focus:border-navy-900 transition-all cursor-pointer ${active ? "border-navy-900 bg-navy-50 text-navy-900" : "border-navy-200 bg-white text-navy-700"}`;
  const Chevron = () => <svg className="absolute right-3 bottom-3 text-navy-400 pointer-events-none" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>;

  const searchBlock = (
    <div className="flex flex-col gap-2.5">
      <SearchField value={searchQuery} onChange={setSearchQuery} label={m.searchLabel} suggestions={m.suggestions} compact={!desktop} />
      <div className="chip-row" role="group" aria-label={m.family}>
        <button type="button" onClick={locate} disabled={locating} className={`chip ${userPos ? "is-on" : ""}`}>
          <span aria-hidden="true">◎</span> {locating ? m.locating : userPos ? m.sortedByDistance : dict.nav.near}
        </button>
        {families.map((f) => (
          <button key={f} type="button" onClick={() => setSelectedFamily(selectedFamily === f ? "" : f)} className={`chip ${selectedFamily === f ? "is-on" : ""}`} aria-pressed={selectedFamily === f}>
            {f}
          </button>
        ))}
      </div>
    </div>
  );

  const resultsHeader = (
    <div className="px-4 pt-3 pb-2">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-heading font-extrabold text-[26px] leading-none text-navy-900 tabular-nums">
            {count}
            <span className="text-body-sm font-bold text-navy-500 ml-2">{displayed.length > 1 ? m.establishmentMany : m.establishmentOne}</span>
          </p>
          <p className="text-caption text-navy-400 mt-1">
            {verifiedCount} {verifiedCount > 1 ? m.verifiedMany : m.verifiedOne}
            {apiCount > 0 && <span> · {apiCount.toLocaleString(fr ? "fr-FR" : "en-GB")} {m.generalists.toLowerCase()} {showApi ? m.shown : m.hidden}</span>}
            {userPos && (
              <button type="button" onClick={() => { setUserPos(null); flyTo(FRANCE_CENTER, FRANCE_ZOOM); }} className="ml-2 underline font-bold text-navy-600">{m.allFrance}</button>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button type="button" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen} className={`chip ${filtersOpen || activeChips.length ? "is-on" : ""}`}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18M6 12h12M10 19h4" /></svg>
            {m.filters}{activeChips.length > 0 && <span className="chip-badge">{activeChips.length}</span>}
          </button>
          {hasFilters && (
            <button type="button" onClick={resetFilters} className="chip chip-danger">{m.clear}</button>
          )}
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {activeChips.map((c) => (
            <button key={c.key} type="button" onClick={c.clear} className="chip is-on chip-sm" aria-label={`${m.clear} : ${c.label}`}>
              {c.label} <span aria-hidden="true">✕</span>
            </button>
          ))}
        </div>
      )}

      <div className={`collapsible ${filtersOpen ? "is-open" : ""}`}>
        <div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 pt-3">
            <label className="field col-span-2"><span>{m.metier}</span>
              <select value={selectedMetier} onChange={(e) => setSelectedMetier(e.target.value)} className={selectClass(!!selectedMetier)}>
                <option value="">{m.allMetiers}</option>
                {Object.entries(metiersByFamily).map(([family, items]) => (
                  <optgroup key={family} label={family}>{items.map((x) => <option key={x.slug} value={x.slug}>{x.nameFr}</option>)}</optgroup>
                ))}
              </select><Chevron />
            </label>
            <label className="field col-span-2"><span>{m.formation}</span>
              <select value={selectedFormation} onChange={(e) => setSelectedFormation(e.target.value)} className={selectClass(!!selectedFormation)}>
                <option value="">{m.allFormations}</option>
                {filterData?.formations.map((x) => <option key={x.slug} value={x.slug}>{x.nameFr}</option>)}
              </select><Chevron />
            </label>
            <label className="field"><span>{m.filterByRegion}</span>
              <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className={selectClass(!!selectedRegion)}>
                <option value="">{m.allRegions}</option>
                {filterData?.regions.map((x) => <option key={x.code} value={x.code}>{x.name}</option>)}
              </select><Chevron />
            </label>
            <label className="field"><span>{m.filterByLevel}</span>
              <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className={selectClass(!!selectedLevel)}>
                <option value="">{m.allLevels}</option>
                {filterData?.levels.map((x) => <option key={x.slug} value={x.slug}>{fr ? x.nameFr : x.nameEn}</option>)}
              </select><Chevron />
            </label>
            <label className="field"><span>{m.filterByDomain}</span>
              <select value={selectedDomain} onChange={(e) => setSelectedDomain(e.target.value)} className={selectClass(!!selectedDomain)}>
                <option value="">{m.allDomains}</option>
                {filterData?.domains.map((x) => <option key={x.slug} value={x.slug}>{fr ? x.nameFr : x.nameEn}</option>)}
              </select><Chevron />
            </label>
            <label className="field"><span>{m.filterByType}</span>
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className={selectClass(!!selectedType)}>
                <option value="">{m.allTypes}</option>
                {filterData?.types.map((x) => <option key={x.slug} value={x.slug}>{fr ? x.nameFr : x.nameEn}</option>)}
              </select><Chevron />
            </label>
            {apiCount > 0 && (
              <label className="col-span-2 flex items-center gap-3 rounded-xl border border-navy-100 bg-navy-50/60 px-3 py-2 cursor-pointer">
                <span className={`switch ${showApi ? "is-on" : ""}`} aria-hidden="true"><span /></span>
                <input type="checkbox" className="sr-only" checked={showApi} onChange={(e) => setShowApi(e.target.checked)} />
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold text-navy-800">{m.generalists} <span className="text-navy-400 font-semibold">({apiCount})</span></span>
                  <span className="block text-[11px] text-navy-400 leading-snug">{m.generalistsHint}</span>
                </span>
              </label>
            )}
          </div>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="mt-3 rounded-xl border border-signal-300 bg-signal-50 px-3 py-2 text-caption text-navy-800 flex items-center justify-between gap-2 animate-rise">
          <span>{loadError}</span>
          <button type="button" onClick={() => { setLoadError(null); setRetryTick((t) => t + 1); }} className="font-bold underline whitespace-nowrap">{m.retry}</button>
        </div>
      )}
    </div>
  );

  const tabs: Array<{ key: View; label: string; count: number }> = [
    { key: "establishments", label: m.tabEstablishments, count: displayed.length },
    { key: "formations", label: m.tabFormations, count: formationsInResults.length },
    { key: "metiers", label: m.tabMetiers, count: metiersInResults.length },
  ];
  const tabIndex = tabs.findIndex((t) => t.key === view);

  const segmented = (
    <div className="px-4 pb-2">
      <div className="segmented" role="tablist">
        <span className="segmented-thumb" style={{ transform: `translateX(${tabIndex * 100}%)` }} aria-hidden="true" />
        {tabs.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={view === t.key} onClick={() => { setView(t.key); listRef.current?.scrollTo({ top: 0 }); }} className={view === t.key ? "is-on" : ""}>
            {t.label} <span className="tabular-nums">{t.count}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const empty = (text: string, hint?: string) => (
    <div className="text-center py-14 px-6 animate-rise">
      <p className="font-heading font-bold text-navy-900">{text}</p>
      {hint && <p className="text-caption text-navy-400 mt-1">{hint}</p>}
      {hasFilters && <button type="button" onClick={resetFilters} className="chip is-on mt-4">{m.resetFilters}</button>}
    </div>
  );

  const list = (
    <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain" role="tabpanel">
      {loading ? (
        <ul className="p-4 space-y-3" aria-label={m.loading}>
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="skeleton-row" style={{ animationDelay: `${i * 80}ms` }}><span /><span /><span /></li>
          ))}
        </ul>
      ) : view === "establishments" ? (
        displayed.length === 0 ? empty(m.noResults, m.noResultsHint) : (
          <ul>
            {displayed.map((est, i) => {
              const active = selected?.id === est.id;
              return (
                <li key={est.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 14) * 35}ms` }}>
                  <button
                    type="button"
                    onClick={() => select(est, 12)}
                    onMouseEnter={() => setHotId(est.id)}
                    onMouseLeave={() => setHotId(null)}
                    aria-current={active ? "true" : undefined}
                    className={`result-row ${active ? "is-active" : ""}`}
                  >
                    <span className="result-dot" style={{ background: est.type.color }} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-heading font-bold text-[14px] leading-snug text-navy-900">{displayName(est.name)}</span>
                      <span className="block text-caption text-navy-400 mt-0.5 truncate">
                        {est.city} · {est.region.name}
                        {userPos && <span className="font-bold text-navy-700"> · {Math.round(distanceKm(userPos, [est.lat, est.lng]))} km</span>}
                      </span>
                      <span className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ background: est.type.color }}>{fr ? est.type.nameFr : est.type.nameEn}</span>
                        {est.source === "api" ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-signal-50 text-signal-800 border border-signal-200">{m.generalistBadge}</span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-eco-50 text-eco-700">✓ {m.verifiedBadge}</span>
                        )}
                        <span className="text-[11px] text-navy-500 font-semibold">{est.formations.length} {est.formations.length > 1 ? m.formations : m.formation}</span>
                      </span>
                    </span>
                    <svg className="result-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )
      ) : view === "formations" ? (
        formationsInResults.length === 0 ? empty(m.noFormations, m.noResultsHint) : (
          <ul>
            {formationsInResults.map(({ formation: f, count: n }, i) => {
              const linked = metiersByFormationSlug[f.slug] ?? [];
              return (
                <li key={f.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 14) * 35}ms` }}>
                  <div className={`result-row is-static ${selectedFormation === f.slug ? "is-active" : ""}`}>
                    <span className="result-dot" style={{ background: f.domain.color }} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <button type="button" onClick={() => pickFormation(f.slug)} className="block text-left font-heading font-bold text-[14px] leading-snug text-navy-900 hover:text-electric-600 transition-colors">
                        {f.nameFr}
                      </button>
                      <p className="text-caption text-navy-400 mt-0.5">
                        {fr ? f.level.nameFr : f.level.nameEn} · {fr ? f.domain.nameFr : f.domain.nameEn}
                        {f.rncpCode && <span className="font-mono"> · RNCP {f.rncpCode}</span>}
                      </p>
                      <p className="text-[11px] font-semibold text-navy-600 mt-1">{n} {n > 1 ? m.establishmentMany : m.establishmentOne}</p>
                      {linked.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {linked.slice(0, 3).map((mt) => (
                            <button key={mt.slug} type="button" onClick={() => pickMetier(mt.slug)} className="chip chip-sm" title={`${m.metier} : ${mt.nameFr}`}>
                              {mt.nameFr.length > 32 ? `${mt.nameFr.slice(0, 30)}…` : mt.nameFr}
                            </button>
                          ))}
                          {linked.length > 3 && <span className="text-[11px] text-navy-400 self-center">+{linked.length - 3}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      ) : (
        metiersInResults.length === 0 ? empty(m.noMetiers, m.noResultsHint) : (
          <ul>
            {Object.entries(metiersInResults.reduce<Record<string, Metier[]>>((acc, mt) => { (acc[mt.family] ??= []).push(mt); return acc; }, {})).map(([family, items]) => (
              <li key={family}>
                <p className="sticky top-0 z-10 px-4 py-1.5 bg-navy-50/95 backdrop-blur text-[10px] font-bold text-navy-500 uppercase tracking-wider">{family}</p>
                <ul>
                  {items.map((mt, i) => (
                    <li key={mt.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}>
                      <button type="button" onClick={() => pickMetier(mt.slug)} className={`result-row ${selectedMetier === mt.slug ? "is-active" : ""}`}>
                        <span className="result-dot bg-signal-300" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-heading font-bold text-[14px] leading-snug text-navy-900">{mt.nameFr}</span>
                          {mt.level && <span className="block text-caption text-navy-400 mt-0.5">{mt.level}</span>}
                        </span>
                        <svg className="result-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );

  const legend = filterData && (
    <div className={`absolute left-3 bottom-3 lg:left-4 lg:bottom-4 z-[1000] ${desktop ? "" : "hidden"}`}>
      {showLegend ? (
        <div className="legend animate-rise">
          <div className="flex items-center justify-between gap-4 mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-navy-500">{m.legend}</p>
            <button type="button" onClick={() => setShowLegend(false)} className="text-navy-400 hover:text-navy-900" aria-label={m.close}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
            {filterData.types.map((t) => (
              <li key={t.slug} className="flex items-center gap-2 text-[11px] text-navy-700">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white shadow" style={{ background: t.color }} aria-hidden="true" />
                {fr ? t.nameFr : t.nameEn}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <button type="button" onClick={() => setShowLegend(true)} className="map-btn" aria-label={m.legend}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="5" cy="6" r="2" /><path d="M10 6h10" /><circle cx="5" cy="12" r="2" /><path d="M10 12h10" /><circle cx="5" cy="18" r="2" /><path d="M10 18h10" /></svg>
        </button>
      )}
    </div>
  );

  const card = selected && (desktop || sheet === "peek") && (
    <EstablishmentCard
      key={selected.id}
      est={selected}
      locale={locale}
      dict={dict}
      userPos={userPos}
      onClose={() => setSelected(null)}
      className={desktop ? "absolute right-4 bottom-4 z-[1000] w-[380px]" : ""}
    />
  );

  // ------------------------------------------------------------------ rendu
  return (
    <div className="relative h-full min-h-0 flex overflow-hidden bg-navy-50">
      {/* Panneau (colonne à gauche sur grand écran, feuille glissante sur mobile) */}
      <aside
        ref={sheetRef}
        style={sheetStyle}
        className="sheet z-[1002] lg:z-auto absolute inset-x-0 bottom-0 top-[118px] lg:static lg:top-auto lg:w-[440px] lg:shrink-0 flex flex-col bg-white lg:border-r border-navy-100 rounded-t-3xl lg:rounded-none shadow-[0_-12px_40px_rgba(12,31,44,.18)] lg:shadow-none"
        aria-label={fr ? "Recherche et résultats" : "Search and results"}
      >
        {desktop ? (
          <div className="px-4 pt-4 pb-3 border-b border-navy-100">{searchBlock}</div>
        ) : (
          <div
            className="sheet-handle"
            onPointerDown={onHandleDown}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
            onPointerCancel={onHandleUp}
            role="button"
            tabIndex={0}
            aria-label={sheet === "peek" ? m.showList : m.showMap}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSheet(sheet === "peek" ? "half" : "peek"); } }}
          >
            <span className="sheet-grip" aria-hidden="true" />
            <span className="text-[11px] font-bold text-navy-400">{sheet === "peek" ? m.dragHint : m.showMap}</span>
          </div>
        )}
        {resultsHeader}
        {segmented}
        {list}
      </aside>

      {/* Carte */}
      <div className="relative flex-1 min-w-0 h-full">
        <MapContainer center={FRANCE_CENTER} zoom={FRANCE_ZOOM} className="w-full h-full" zoomControl={false} minZoom={5}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          {desktop && <ZoomControl position="bottomright" />}
          <MapController target={fly} />
          <UserDot position={userPos} />
          <MarkerClusterLayer establishments={displayed} selectedId={selected?.id ?? null} hotId={hotId} onSelect={(est) => select(est)} />
        </MapContainer>

        {!desktop && (
          <div className="absolute inset-x-3 top-3 z-[1000] over-map">{searchBlock}</div>
        )}

        <div className="absolute right-3 top-[124px] lg:right-4 lg:top-4 z-[1000]">
          <button type="button" onClick={() => flyTo(FRANCE_CENTER, FRANCE_ZOOM)} className="map-btn" aria-label={m.recenter} title={m.recenter}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /><circle cx="12" cy="12" r="3" /></svg>
          </button>
        </div>

        {legend}
        {desktop && card}
      </div>

      {!desktop && card && <div className="absolute inset-x-3 z-[1003]" style={{ bottom: PEEK + 8 }}>{card}</div>}
    </div>
  );
}
