"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";

// ============================================================
// Types
// ============================================================

interface Region { id: string; name: string; code: string }
interface EstType { id: string; slug: string; nameFr: string; color: string }
interface Level { id: string; slug: string; nameFr: string; order: number }
interface Domain { id: string; slug: string; nameFr: string; color: string }
interface Formation {
  id: string; slug: string; nameFr: string; nameEn: string | null;
  rncpCode: string | null; onisepUrl: string | null; jobTarget: string | null;
  level: Level; domain: Domain;
  establishments: Array<{ establishment: { id: string; name: string; city: string } }>;
  metiers: Array<{ metier: { id: string; nameFr: string } }>;
}
interface Establishment {
  id: string; slug: string; name: string; city: string; lat: number; lng: number;
  website: string | null; address: string | null;
  type: EstType; region: Region;
  formations: Array<{ formation: Formation }>;
}
interface Metier {
  id: string; slug: string; nameFr: string; nameEn: string | null;
  family: string; source: string; level: string | null;
  formations: Array<{ formation: { id: string; nameFr: string; slug: string } }>;
}

type Tab = "dashboard" | "establishments" | "formations" | "metiers" | "links-ef" | "links-mf";

// ============================================================
// Login Screen
// ============================================================

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onLogin();
      } else {
        setError("Mot de passe incorrect");
      }
    } catch {
      setError("Erreur de connexion");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B2A5B] via-[#1e3068] to-[#162249] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-4">
            <svg width="32" height="32" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Administration</h1>
          <p className="text-blue-200 text-sm">Formations Ferroviaires</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <label className="block text-sm font-medium text-blue-100 mb-2">
            Mot de passe
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez le mot de passe..."
              className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent text-sm"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition-colors p-1"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          {error && (
            <p className="text-red-300 text-sm mt-2 flex items-center gap-1.5">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M10 6v4M10 13h.01"/></svg>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full mt-4 px-4 py-3 bg-[#00BCD4] hover:bg-[#00acc1] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="text-center mt-6">
          <a href="/fr" className="text-blue-300 hover:text-white text-sm transition-colors">
            Retour a la carte
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Stat Card
// ============================================================

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Admin Page
// ============================================================

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [metiers, setMetiers] = useState<Metier[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [types, setTypes] = useState<EstType[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = useCallback((type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  // Check auth on mount
  useEffect(() => {
    fetch("/api/admin/auth").then((res) => {
      setAuthenticated(res.ok);
    }).catch(() => setAuthenticated(false));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [estRes, formRes, metRes, filterRes] = await Promise.all([
        fetch("/api/admin/establishments"),
        fetch("/api/admin/formations"),
        fetch("/api/admin/metiers"),
        fetch("/api/filters"),
      ]);
      if (!estRes.ok) { setAuthenticated(false); return; }
      setEstablishments(await estRes.json());
      setFormations(await formRes.json());
      setMetiers(await metRes.json());
      const filters = await filterRes.json();
      setRegions(filters.regions);
      setTypes(filters.types);
      setLevels(filters.levels);
      setDomains(filters.domains);
    } catch (e) {
      console.error(e);
      showMessage("error", "Erreur de chargement");
    }
    setLoading(false);
  }, [showMessage]);

  useEffect(() => {
    if (authenticated) loadData();
  }, [authenticated, loadData]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthenticated(false);
  };

  // Loading auth check
  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1B2A5B] via-[#1e3068] to-[#162249] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Login
  if (!authenticated) {
    return <LoginScreen onLogin={() => setAuthenticated(true)} />;
  }

  const totalLinksEF = establishments.reduce((s, e) => s + e.formations.length, 0);
  const totalLinksMF = metiers.reduce((s, m) => s + m.formations.length, 0);

  const sidebarItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: "dashboard", label: "Tableau de bord",
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    },
    {
      key: "establishments", label: `Etablissements (${establishments.length})`,
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg>,
    },
    {
      key: "formations", label: `Formations (${formations.length})`,
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
    },
    {
      key: "metiers", label: `Metiers (${metiers.length})`,
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,
    },
    {
      key: "links-ef", label: `Liens Etab-Form (${totalLinksEF})`,
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
    },
    {
      key: "links-mf", label: `Liens Met-Form (${totalLinksMF})`,
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - sticky */}
      <aside className="w-64 bg-[#1B2A5B] text-white flex flex-col h-screen sticky top-0 shrink-0">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight">Administration</h1>
              <p className="text-blue-300 text-[11px]">Formations Ferroviaires</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold text-blue-400 uppercase tracking-wider">General</p>
          {sidebarItems.slice(0, 1).map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === item.key
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-blue-200 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Donnees</p>
          {sidebarItems.slice(1, 4).map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === item.key
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-blue-200 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Relations</p>
          {sidebarItems.slice(4).map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === item.key
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-blue-200 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <a
            href="/fr"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-blue-200 hover:bg-white/5 hover:text-white transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            Voir la carte
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Deconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Toast */}
        {message && (
          <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
            message.type === "success" ? "bg-emerald-500" : "bg-red-500"
          }`}>
            {message.type === "success" ? (
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
            ) : (
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
            )}
            {message.text}
          </div>
        )}

        <div className="p-6 lg:p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-[#1B2A5B] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {tab === "dashboard" && (
                <DashboardTab
                  establishments={establishments}
                  formations={formations}
                  metiers={metiers}
                  totalLinksEF={totalLinksEF}
                  totalLinksMF={totalLinksMF}
                />
              )}
              {tab === "establishments" && (
                <EstablishmentsTab establishments={establishments} regions={regions} types={types} onRefresh={loadData} onMessage={showMessage} />
              )}
              {tab === "formations" && (
                <FormationsTab formations={formations} levels={levels} domains={domains} onRefresh={loadData} onMessage={showMessage} />
              )}
              {tab === "metiers" && (
                <MetiersTab metiers={metiers} onRefresh={loadData} onMessage={showMessage} />
              )}
              {tab === "links-ef" && (
                <LinksEFTab establishments={establishments} formations={formations} onRefresh={loadData} onMessage={showMessage} />
              )}
              {tab === "links-mf" && (
                <LinksMFTab metiers={metiers} formations={formations} onRefresh={loadData} onMessage={showMessage} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ============================================================
// Dashboard Tab
// ============================================================

function DashboardTab({
  establishments, formations, metiers, totalLinksEF, totalLinksMF,
}: {
  establishments: Establishment[]; formations: Formation[]; metiers: Metier[];
  totalLinksEF: number; totalLinksMF: number;
}) {
  const orphanFormations = formations.filter((f) => f.establishments.length === 0);
  const orphanMetiers = metiers.filter((m) => m.formations.length === 0);
  const formationsNoMetier = formations.filter((f) => f.metiers.length === 0);
  const alertCount = orphanFormations.length + orphanMetiers.length + formationsNoMetier.length;

  // Coverage stats
  const avgFormPerEst = establishments.length > 0 ? (totalLinksEF / establishments.length).toFixed(1) : "0";
  const avgMetPerForm = formations.length > 0 ? (totalLinksMF / formations.length).toFixed(1) : "0";

  // Top formations by number of establishments
  const topFormations = [...formations]
    .sort((a, b) => b.establishments.length - a.establishments.length)
    .slice(0, 5);

  // Repartition by type
  const byType: Record<string, { count: number; color: string }> = {};
  establishments.forEach((e) => {
    if (!byType[e.type.nameFr]) byType[e.type.nameFr] = { count: 0, color: e.type.color };
    byType[e.type.nameFr].count++;
  });
  const typeEntries = Object.entries(byType).sort((a, b) => b[1].count - a[1].count);

  // Repartition by region
  const byRegion: Record<string, number> = {};
  establishments.forEach((e) => {
    byRegion[e.region.name] = (byRegion[e.region.name] || 0) + 1;
  });
  const regionEntries = Object.entries(byRegion).sort((a, b) => b[1] - a[1]);
  const maxRegionCount = regionEntries[0]?.[1] || 1;

  // Metiers by family
  const byFamily: Record<string, number> = {};
  metiers.forEach((m) => {
    byFamily[m.family] = (byFamily[m.family] || 0) + 1;
  });
  const familyEntries = Object.entries(byFamily).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>
          <p className="text-sm text-gray-500 mt-0.5">Vue d&apos;ensemble des donnees</p>
        </div>
        {alertCount === 0 ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
            Tout est OK
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            {alertCount} alerte{alertCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Main stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <StatCard label="Etablissements" value={establishments.length} color="bg-blue-50 text-blue-600"
          icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg>} />
        <StatCard label="Formations" value={formations.length} color="bg-emerald-50 text-emerald-600"
          icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>} />
        <StatCard label="Metiers" value={metiers.length} color="bg-amber-50 text-amber-600"
          icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>} />
        <StatCard label="Liens Etab-Form" value={totalLinksEF} color="bg-purple-50 text-purple-600"
          icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>} />
        <StatCard label="Liens Met-Form" value={totalLinksMF} color="bg-pink-50 text-pink-600"
          icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>} />
      </div>

      {/* Coverage indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Moy. formations / etab.</p>
          <p className="text-3xl font-bold text-gray-900">{avgFormPerEst}</p>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(Number(avgFormPerEst) * 20, 100)}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Moy. metiers / formation</p>
          <p className="text-3xl font-bold text-gray-900">{avgMetPerForm}</p>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(Number(avgMetPerForm) * 15, 100)}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Taux de couverture</p>
          <p className="text-3xl font-bold text-gray-900">
            {formations.length > 0 ? Math.round(((formations.length - orphanFormations.length) / formations.length) * 100) : 100}%
          </p>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${formations.length > 0 ? ((formations.length - orphanFormations.length) / formations.length) * 100 : 100}%` }} />
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top formations */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-800 text-sm">Top formations par etablissements</h3>
          </div>
          <div className="p-2">
            {topFormations.map((f, i) => (
              <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                  i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-50 text-orange-600" : "bg-gray-50 text-gray-400"
                }`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{f.nameFr}</p>
                  <p className="text-[11px] text-gray-400">{f.level.nameFr}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">{f.establishments.length}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By type */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-800 text-sm">Repartition par type</h3>
          </div>
          <div className="p-4 space-y-3">
            {typeEntries.map(([name, { count, color }]) => (
              <div key={name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">{name}</span>
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden shrink-0">
                  <div className="h-full rounded-full" style={{ backgroundColor: color, width: `${(count / establishments.length) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-600 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By region */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-800 text-sm">Repartition par region</h3>
          </div>
          <div className="p-4 space-y-2 max-h-[320px] overflow-y-auto">
            {regionEntries.map(([name, count]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 flex-1 min-w-0 truncate">{name}</span>
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden shrink-0">
                  <div className="h-full bg-[#1B2A5B] rounded-full" style={{ width: `${(count / maxRegionCount) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-600 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Metiers by family */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-800 text-sm">Metiers par famille</h3>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {familyEntries.map(([family, count]) => (
                <span key={family} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                  {family}
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold">{count}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(orphanFormations.length > 0 || orphanMetiers.length > 0 || formationsNoMetier.length > 0) && (
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-amber-500"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
            Alertes qualite
          </h3>

          {orphanFormations.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 className="font-semibold text-amber-800 text-xs mb-2.5 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-200 text-amber-800 text-[10px] font-bold">{orphanFormations.length}</span>
                formation(s) sans etablissement
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {orphanFormations.map((f) => (
                  <span key={f.id} className="px-2 py-1 bg-white rounded-lg text-[11px] text-amber-700 border border-amber-200">{f.nameFr}</span>
                ))}
              </div>
            </div>
          )}

          {formationsNoMetier.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <h4 className="font-semibold text-orange-800 text-xs mb-2.5 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-orange-200 text-orange-800 text-[10px] font-bold">{formationsNoMetier.length}</span>
                formation(s) sans metier
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {formationsNoMetier.map((f) => (
                  <span key={f.id} className="px-2 py-1 bg-white rounded-lg text-[11px] text-orange-700 border border-orange-200">{f.nameFr}</span>
                ))}
              </div>
            </div>
          )}

          {orphanMetiers.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h4 className="font-semibold text-red-800 text-xs mb-2.5 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-red-200 text-red-800 text-[10px] font-bold">{orphanMetiers.length}</span>
                metier(s) sans formation
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {orphanMetiers.map((m) => (
                  <span key={m.id} className="px-2 py-1 bg-white rounded-lg text-[11px] text-red-700 border border-red-200">{m.nameFr}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {alertCount === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-3">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-emerald-500"><path d="M20 6L9 17l-5-5"/></svg>
          <p className="text-emerald-800 font-medium text-sm">Toutes les donnees sont correctement reliees. Aucune alerte.</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Section Header
// ============================================================

function SectionHeader({ title, count, filteredCount, onAdd, search, onSearch, onExport, onImport, filterBar }: {
  title: string; count: number; filteredCount?: number; onAdd: () => void; search: string; onSearch: (v: string) => void;
  onExport?: () => void; onImport?: (file: File) => void; filterBar?: React.ReactNode;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title} <span className="text-gray-400 text-lg font-normal">({filteredCount !== undefined && filteredCount !== count ? `${filteredCount}/` : ""}{count})</span></h2>
        </div>
        <div className="flex items-center gap-2">
          {onImport && (
            <>
              <input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onImport(e.target.files[0]); e.target.value = ""; }} />
              <button onClick={() => fileRef.current?.click()} className="px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5" title="Importer Excel">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                Importer
              </button>
            </>
          )}
          {onExport && (
            <button onClick={onExport} className="px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5" title="Exporter Excel">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Exporter
            </button>
          )}
          <button onClick={onAdd} className="px-4 py-2 bg-[#1B2A5B] text-white rounded-xl text-xs font-semibold hover:bg-[#253672] transition-colors flex items-center gap-1.5">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            Ajouter
          </button>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A5B]/20 focus:border-[#1B2A5B]"
          />
        </div>
        {filterBar}
      </div>
    </div>
  );
}

// ============================================================
// Form Modal
// ============================================================

function FormModal({ title, children, onClose, onSubmit, submitLabel }: {
  title: string; children: React.ReactNode; onClose: () => void; onSubmit: () => void; submitLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-lg text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          {children}
        </div>
        <div className="flex justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Annuler
          </button>
          <button onClick={onSubmit} className="px-5 py-2.5 bg-[#1B2A5B] text-white rounded-xl text-sm font-semibold hover:bg-[#253672] transition-colors">
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A5B]/20 focus:border-[#1B2A5B]";
const selectClass = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A5B]/20 focus:border-[#1B2A5B] bg-white";

// ============================================================
// Establishments Tab
// ============================================================

function EstablishmentsTab({
  establishments, regions, types, onRefresh, onMessage,
}: {
  establishments: Establishment[]; regions: Region[]; types: EstType[];
  onRefresh: () => void; onMessage: (type: "success" | "error", text: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [form, setForm] = useState({
    name: "", city: "", lat: "", lng: "", typeId: "", regionId: "", website: "", address: "",
  });

  const filtered = establishments.filter((e) => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.city.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || e.type.id === filterType;
    const matchRegion = !filterRegion || e.region.id === filterRegion;
    return matchSearch && matchType && matchRegion;
  });

  const handleExport = () => {
    const data = filtered.map((e) => ({
      Nom: e.name, Ville: e.city, Region: e.region.name, Type: e.type.nameFr,
      Latitude: e.lat, Longitude: e.lng, Site_web: e.website || "", Adresse: e.address || "",
      Nb_formations: e.formations.length,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Etablissements");
    XLSX.writeFile(wb, "etablissements.xlsx");
  };

  const handleImport = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws);
      let created = 0;
      for (const row of rows) {
        const name = String(row["Nom"] || "").trim();
        const city = String(row["Ville"] || "").trim();
        const lat = String(row["Latitude"] || "");
        const lng = String(row["Longitude"] || "");
        if (!name || !city || !lat || !lng) continue;
        const typeName = String(row["Type"] || "").trim();
        const regionName = String(row["Region"] || "").trim();
        const matchedType = types.find((t) => t.nameFr.toLowerCase() === typeName.toLowerCase());
        const matchedRegion = regions.find((r) => r.name.toLowerCase() === regionName.toLowerCase());
        if (!matchedType || !matchedRegion) continue;
        try {
          const res = await fetch("/api/admin/establishments", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, city, lat, lng, typeId: matchedType.id, regionId: matchedRegion.id, website: String(row["Site_web"] || "") || null, address: String(row["Adresse"] || "") || null }),
          });
          if (res.ok) created++;
        } catch { /* skip duplicates */ }
      }
      onMessage("success", `${created} etablissement(s) importe(s)`);
      onRefresh();
    } catch { onMessage("error", "Erreur lors de l'import"); }
  };

  const resetForm = () => { setForm({ name: "", city: "", lat: "", lng: "", typeId: "", regionId: "", website: "", address: "" }); setEditId(null); setShowForm(false); };

  const startEdit = (est: Establishment) => {
    setForm({ name: est.name, city: est.city, lat: String(est.lat), lng: String(est.lng), typeId: est.type.id, regionId: est.region.id, website: est.website || "", address: est.address || "" });
    setEditId(est.id); setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.city || !form.lat || !form.lng || !form.typeId || !form.regionId) { onMessage("error", "Champs obligatoires manquants"); return; }
    try {
      const url = editId ? `/api/admin/establishments/${editId}` : "/api/admin/establishments";
      const res = await fetch(url, { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      onMessage("success", editId ? "Etablissement modifie" : "Etablissement cree");
      resetForm(); onRefresh();
    } catch { onMessage("error", "Erreur lors de la sauvegarde"); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    try {
      const res = await fetch(`/api/admin/establishments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onMessage("success", "Etablissement supprime"); onRefresh();
    } catch { onMessage("error", "Erreur lors de la suppression"); }
  };

  return (
    <div>
      <SectionHeader
        title="Etablissements" count={establishments.length} filteredCount={filtered.length}
        onAdd={() => { resetForm(); setShowForm(true); }} search={search} onSearch={setSearch}
        onExport={handleExport} onImport={handleImport}
        filterBar={
          <div className="flex gap-2">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={`py-2.5 px-3 border border-gray-200 rounded-xl text-xs bg-white ${filterType ? "border-blue-300 bg-blue-50 text-blue-700" : "text-gray-500"}`}>
              <option value="">Tous les types</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.nameFr}</option>)}
            </select>
            <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className={`py-2.5 px-3 border border-gray-200 rounded-xl text-xs bg-white ${filterRegion ? "border-green-300 bg-green-50 text-green-700" : "text-gray-500"}`}>
              <option value="">Toutes les regions</option>
              {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        }
      />

      {showForm && (
        <FormModal title={editId ? "Modifier l'etablissement" : "Ajouter un etablissement"} onClose={resetForm} onSubmit={handleSubmit} submitLabel={editId ? "Sauvegarder" : "Creer"}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nom" required>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Ville" required>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Latitude" required>
              <input type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Longitude" required>
              <input type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Type" required>
              <select value={form.typeId} onChange={(e) => setForm({ ...form, typeId: e.target.value })} className={selectClass}>
                <option value="">Choisir...</option>
                {types.map((t) => <option key={t.id} value={t.id}>{t.nameFr}</option>)}
              </select>
            </FormField>
            <FormField label="Region" required>
              <select value={form.regionId} onChange={(e) => setForm({ ...form, regionId: e.target.value })} className={selectClass}>
                <option value="">Choisir...</option>
                {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Adresse">
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="Site web">
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputClass} placeholder="https://..." />
          </FormField>
        </FormModal>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/80">
                <th className="px-4 py-3.5 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Nom</th>
                <th className="px-4 py-3.5 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Ville</th>
                <th className="px-4 py-3.5 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Region</th>
                <th className="px-4 py-3.5 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Type</th>
                <th className="px-4 py-3.5 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider">Form.</th>
                <th className="px-4 py-3.5 text-right font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((est) => (
                <tr key={est.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{est.name}</td>
                  <td className="px-4 py-3 text-gray-500">{est.city}</td>
                  <td className="px-4 py-3 text-gray-500">{est.region.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs text-white font-medium" style={{ backgroundColor: est.type.color }}>
                      {est.type.nameFr}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
                      {est.formations.length}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => startEdit(est)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Modifier">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(est.id, est.name)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title="Supprimer">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Formations Tab
// ============================================================

function FormationsTab({
  formations, levels, domains, onRefresh, onMessage,
}: {
  formations: Formation[]; levels: Level[]; domains: Domain[];
  onRefresh: () => void; onMessage: (type: "success" | "error", text: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterDomain, setFilterDomain] = useState("");
  const [form, setForm] = useState({
    nameFr: "", nameEn: "", rncpCode: "", levelId: "", domainId: "", jobTarget: "", onisepUrl: "",
  });

  const filtered = formations.filter((f) => {
    const matchSearch = !search || f.nameFr.toLowerCase().includes(search.toLowerCase()) || (f.rncpCode && f.rncpCode.includes(search));
    const matchLevel = !filterLevel || f.level.id === filterLevel;
    const matchDomain = !filterDomain || f.domain.id === filterDomain;
    return matchSearch && matchLevel && matchDomain;
  });

  const handleExport = () => {
    const data = filtered.map((f) => ({
      Nom: f.nameFr, Nom_EN: f.nameEn || "", Code_RNCP: f.rncpCode || "",
      Niveau: f.level.nameFr, Domaine: f.domain.nameFr,
      Metier_vise: f.jobTarget || "", URL_ONISEP: f.onisepUrl || "",
      Nb_etablissements: f.establishments.length, Nb_metiers: f.metiers.length,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Formations");
    XLSX.writeFile(wb, "formations.xlsx");
  };

  const handleImport = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws);
      let created = 0;
      for (const row of rows) {
        const nameFr = String(row["Nom"] || "").trim();
        if (!nameFr) continue;
        const levelName = String(row["Niveau"] || "").trim();
        const domainName = String(row["Domaine"] || "").trim();
        const matchedLevel = levels.find((l) => l.nameFr.toLowerCase() === levelName.toLowerCase());
        const matchedDomain = domains.find((d) => d.nameFr.toLowerCase() === domainName.toLowerCase());
        if (!matchedLevel || !matchedDomain) continue;
        try {
          const res = await fetch("/api/admin/formations", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nameFr, nameEn: String(row["Nom_EN"] || "") || null, rncpCode: String(row["Code_RNCP"] || "") || null, levelId: matchedLevel.id, domainId: matchedDomain.id, jobTarget: String(row["Metier_vise"] || "") || null, onisepUrl: String(row["URL_ONISEP"] || "") || null }),
          });
          if (res.ok) created++;
        } catch { /* skip */ }
      }
      onMessage("success", `${created} formation(s) importee(s)`);
      onRefresh();
    } catch { onMessage("error", "Erreur lors de l'import"); }
  };

  const resetForm = () => { setForm({ nameFr: "", nameEn: "", rncpCode: "", levelId: "", domainId: "", jobTarget: "", onisepUrl: "" }); setEditId(null); setShowForm(false); };

  const startEdit = (f: Formation) => {
    setForm({ nameFr: f.nameFr, nameEn: f.nameEn || "", rncpCode: f.rncpCode || "", levelId: f.level.id, domainId: f.domain.id, jobTarget: f.jobTarget || "", onisepUrl: f.onisepUrl || "" });
    setEditId(f.id); setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.nameFr || !form.levelId || !form.domainId) { onMessage("error", "Champs obligatoires manquants"); return; }
    try {
      const url = editId ? `/api/admin/formations/${editId}` : "/api/admin/formations";
      const res = await fetch(url, { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      onMessage("success", editId ? "Formation modifiee" : "Formation creee");
      resetForm(); onRefresh();
    } catch { onMessage("error", "Erreur lors de la sauvegarde"); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    try {
      const res = await fetch(`/api/admin/formations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onMessage("success", "Formation supprimee"); onRefresh();
    } catch { onMessage("error", "Erreur lors de la suppression"); }
  };

  return (
    <div>
      <SectionHeader
        title="Formations" count={formations.length} filteredCount={filtered.length}
        onAdd={() => { resetForm(); setShowForm(true); }} search={search} onSearch={setSearch}
        onExport={handleExport} onImport={handleImport}
        filterBar={
          <div className="flex gap-2">
            <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className={`py-2.5 px-3 border border-gray-200 rounded-xl text-xs bg-white ${filterLevel ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "text-gray-500"}`}>
              <option value="">Tous les niveaux</option>
              {levels.map((l) => <option key={l.id} value={l.id}>{l.nameFr}</option>)}
            </select>
            <select value={filterDomain} onChange={(e) => setFilterDomain(e.target.value)} className={`py-2.5 px-3 border border-gray-200 rounded-xl text-xs bg-white ${filterDomain ? "border-purple-300 bg-purple-50 text-purple-700" : "text-gray-500"}`}>
              <option value="">Tous les domaines</option>
              {domains.map((d) => <option key={d.id} value={d.id}>{d.nameFr}</option>)}
            </select>
          </div>
        }
      />

      {showForm && (
        <FormModal title={editId ? "Modifier la formation" : "Ajouter une formation"} onClose={resetForm} onSubmit={handleSubmit} submitLabel={editId ? "Sauvegarder" : "Creer"}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField label="Nom FR" required>
                <input value={form.nameFr} onChange={(e) => setForm({ ...form, nameFr: e.target.value })} className={inputClass} />
              </FormField>
            </div>
            <div className="col-span-2">
              <FormField label="Nom EN">
                <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className={inputClass} />
              </FormField>
            </div>
            <FormField label="Code RNCP">
              <input value={form.rncpCode} onChange={(e) => setForm({ ...form, rncpCode: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Niveau" required>
              <select value={form.levelId} onChange={(e) => setForm({ ...form, levelId: e.target.value })} className={selectClass}>
                <option value="">Choisir...</option>
                {levels.map((l) => <option key={l.id} value={l.id}>{l.nameFr}</option>)}
              </select>
            </FormField>
            <FormField label="Domaine" required>
              <select value={form.domainId} onChange={(e) => setForm({ ...form, domainId: e.target.value })} className={selectClass}>
                <option value="">Choisir...</option>
                {domains.map((d) => <option key={d.id} value={d.id}>{d.nameFr}</option>)}
              </select>
            </FormField>
            <FormField label="URL ONISEP">
              <input value={form.onisepUrl} onChange={(e) => setForm({ ...form, onisepUrl: e.target.value })} className={inputClass} placeholder="https://..." />
            </FormField>
          </div>
          <FormField label="Metier vise">
            <input value={form.jobTarget} onChange={(e) => setForm({ ...form, jobTarget: e.target.value })} className={inputClass} />
          </FormField>
        </FormModal>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/80">
                <th className="px-4 py-3.5 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Nom</th>
                <th className="px-4 py-3.5 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">RNCP</th>
                <th className="px-4 py-3.5 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Niveau</th>
                <th className="px-4 py-3.5 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Domaine</th>
                <th className="px-4 py-3.5 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider">Etab.</th>
                <th className="px-4 py-3.5 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider">Met.</th>
                <th className="px-4 py-3.5 text-right font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{f.nameFr}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{f.rncpCode || "-"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{f.level.nameFr}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs text-white font-medium" style={{ backgroundColor: f.domain.color }}>{f.domain.nameFr}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-semibold ${f.establishments.length === 0 ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"}`}>
                      {f.establishments.length}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-semibold ${f.metiers.length === 0 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
                      {f.metiers.length}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => startEdit(f)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Modifier">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(f.id, f.nameFr)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title="Supprimer">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Metiers Tab
// ============================================================

function MetiersTab({
  metiers, onRefresh, onMessage,
}: {
  metiers: Metier[];
  onRefresh: () => void; onMessage: (type: "success" | "error", text: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterFamily, setFilterFamily] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [form, setForm] = useState({ nameFr: "", nameEn: "", family: "", source: "futurentrain", level: "" });

  const families = Array.from(new Set(metiers.map((m) => m.family))).sort();
  const sources = Array.from(new Set(metiers.map((m) => m.source))).sort();
  const filtered = metiers.filter((m) => {
    const matchSearch = !search || m.nameFr.toLowerCase().includes(search.toLowerCase()) || m.family.toLowerCase().includes(search.toLowerCase());
    const matchFamily = !filterFamily || m.family === filterFamily;
    const matchSource = !filterSource || m.source === filterSource;
    return matchSearch && matchFamily && matchSource;
  });

  const handleExport = () => {
    const data = filtered.map((m) => ({
      Nom: m.nameFr, Nom_EN: m.nameEn || "", Famille: m.family,
      Source: m.source, Niveau: m.level || "", Nb_formations: m.formations.length,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Metiers");
    XLSX.writeFile(wb, "metiers.xlsx");
  };

  const handleImport = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws);
      let created = 0;
      for (const row of rows) {
        const nameFr = String(row["Nom"] || "").trim();
        const family = String(row["Famille"] || "").trim();
        const source = String(row["Source"] || "futurentrain").trim();
        if (!nameFr || !family) continue;
        try {
          const res = await fetch("/api/admin/metiers", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nameFr, nameEn: String(row["Nom_EN"] || "") || null, family, source, level: String(row["Niveau"] || "") || null }),
          });
          if (res.ok) created++;
        } catch { /* skip */ }
      }
      onMessage("success", `${created} metier(s) importe(s)`);
      onRefresh();
    } catch { onMessage("error", "Erreur lors de l'import"); }
  };

  const resetForm = () => { setForm({ nameFr: "", nameEn: "", family: "", source: "futurentrain", level: "" }); setEditId(null); setShowForm(false); };

  const startEdit = (m: Metier) => {
    setForm({ nameFr: m.nameFr, nameEn: m.nameEn || "", family: m.family, source: m.source, level: m.level || "" });
    setEditId(m.id); setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.nameFr || !form.family || !form.source) { onMessage("error", "Champs obligatoires manquants"); return; }
    try {
      const url = editId ? `/api/admin/metiers/${editId}` : "/api/admin/metiers";
      const res = await fetch(url, { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      onMessage("success", editId ? "Metier modifie" : "Metier cree");
      resetForm(); onRefresh();
    } catch { onMessage("error", "Erreur lors de la sauvegarde"); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    try {
      const res = await fetch(`/api/admin/metiers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onMessage("success", "Metier supprime"); onRefresh();
    } catch { onMessage("error", "Erreur lors de la suppression"); }
  };

  return (
    <div>
      <SectionHeader
        title="Metiers" count={metiers.length} filteredCount={filtered.length}
        onAdd={() => { resetForm(); setShowForm(true); }} search={search} onSearch={setSearch}
        onExport={handleExport} onImport={handleImport}
        filterBar={
          <div className="flex gap-2">
            <select value={filterFamily} onChange={(e) => setFilterFamily(e.target.value)} className={`py-2.5 px-3 border border-gray-200 rounded-xl text-xs bg-white ${filterFamily ? "border-amber-300 bg-amber-50 text-amber-700" : "text-gray-500"}`}>
              <option value="">Toutes les familles</option>
              {families.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className={`py-2.5 px-3 border border-gray-200 rounded-xl text-xs bg-white ${filterSource ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "text-gray-500"}`}>
              <option value="">Toutes les sources</option>
              {sources.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        }
      />

      {showForm && (
        <FormModal title={editId ? "Modifier le metier" : "Ajouter un metier"} onClose={resetForm} onSubmit={handleSubmit} submitLabel={editId ? "Sauvegarder" : "Creer"}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField label="Nom FR" required>
                <input value={form.nameFr} onChange={(e) => setForm({ ...form, nameFr: e.target.value })} className={inputClass} />
              </FormField>
            </div>
            <div className="col-span-2">
              <FormField label="Nom EN">
                <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className={inputClass} />
              </FormField>
            </div>
            <FormField label="Famille" required>
              <input value={form.family} onChange={(e) => setForm({ ...form, family: e.target.value })} className={inputClass} list="families" />
              <datalist id="families">{families.map((f) => <option key={f} value={f} />)}</datalist>
            </FormField>
            <FormField label="Source" required>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={selectClass}>
                <option value="futurentrain">futurentrain</option>
                <option value="aveclindustrieferroviaire">aveclindustrieferroviaire</option>
              </select>
            </FormField>
            <FormField label="Niveau">
              <input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={inputClass} placeholder="CAP, BAC, BAC+2..." />
            </FormField>
          </div>
        </FormModal>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/80">
                <th className="px-4 py-3.5 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Nom</th>
                <th className="px-4 py-3.5 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Famille</th>
                <th className="px-4 py-3.5 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Source</th>
                <th className="px-4 py-3.5 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Niveau</th>
                <th className="px-4 py-3.5 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider">Form.</th>
                <th className="px-4 py-3.5 text-right font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{m.nameFr}</td>
                  <td className="px-4 py-3 text-gray-500">{m.family}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{m.source}</td>
                  <td className="px-4 py-3 text-gray-500">{m.level || "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-semibold ${m.formations.length === 0 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
                      {m.formations.length}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => startEdit(m)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Modifier">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(m.id, m.nameFr)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title="Supprimer">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Links Establishment-Formation Tab
// ============================================================

function LinksEFTab({
  establishments, formations, onRefresh, onMessage,
}: {
  establishments: Establishment[]; formations: Formation[];
  onRefresh: () => void; onMessage: (type: "success" | "error", text: string) => void;
}) {
  const [selEst, setSelEst] = useState("");
  const [selForm, setSelForm] = useState("");
  const [filterEst, setFilterEst] = useState("");

  const filteredEst = establishments.filter(
    (e) => e.name.toLowerCase().includes(filterEst.toLowerCase()) || e.city.toLowerCase().includes(filterEst.toLowerCase())
  );

  const handleAdd = async () => {
    if (!selEst || !selForm) { onMessage("error", "Selectionnez un etablissement et une formation"); return; }
    try {
      const res = await fetch("/api/admin/establishment-formations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ establishmentId: selEst, formationId: selForm }) });
      if (!res.ok) throw new Error();
      onMessage("success", "Lien cree"); setSelForm(""); onRefresh();
    } catch { onMessage("error", "Erreur (lien existe deja ?)"); }
  };

  const handleRemove = async (estId: string, formId: string) => {
    try {
      const res = await fetch(`/api/admin/establishment-formations?establishmentId=${estId}&formationId=${formId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onMessage("success", "Lien supprime"); onRefresh();
    } catch { onMessage("error", "Erreur lors de la suppression"); }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-5">Liens Etablissement - Formation</h2>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm">Ajouter un lien</h3>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">Etablissement</label>
            <select value={selEst} onChange={(e) => setSelEst(e.target.value)} className={selectClass}>
              <option value="">-- Choisir --</option>
              {establishments.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.city})</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">Formation</label>
            <select value={selForm} onChange={(e) => setSelForm(e.target.value)} className={selectClass}>
              <option value="">-- Choisir --</option>
              {formations.map((f) => <option key={f.id} value={f.id}>{f.nameFr}</option>)}
            </select>
          </div>
          <button onClick={handleAdd} className="px-5 py-2.5 bg-[#1B2A5B] text-white rounded-xl text-sm font-semibold hover:bg-[#253672] transition-colors">
            Ajouter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="font-semibold text-gray-800 text-sm">Liens existants</h3>
          <div className="relative flex-1">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input type="text" value={filterEst} onChange={(e) => setFilterEst(e.target.value)} placeholder="Filtrer..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A5B]/20" />
          </div>
        </div>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {filteredEst.filter((e) => e.formations.length > 0).map((est) => (
            <div key={est.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
              <h4 className="font-medium text-gray-900 text-sm mb-2.5">
                {est.name} <span className="text-gray-400 font-normal">- {est.city}</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {est.formations.map((ef) => (
                  <span key={ef.formation.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                    {ef.formation.nameFr}
                    <button onClick={() => handleRemove(est.id, ef.formation.id)} className="text-blue-400 hover:text-red-500 transition-colors" title="Supprimer">
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Links Metier-Formation Tab
// ============================================================

function LinksMFTab({
  metiers, formations, onRefresh, onMessage,
}: {
  metiers: Metier[]; formations: Formation[];
  onRefresh: () => void; onMessage: (type: "success" | "error", text: string) => void;
}) {
  const [selMet, setSelMet] = useState("");
  const [selForm, setSelForm] = useState("");
  const [filterMet, setFilterMet] = useState("");

  const filteredMet = metiers.filter((m) => m.nameFr.toLowerCase().includes(filterMet.toLowerCase()) || m.family.toLowerCase().includes(filterMet.toLowerCase()));

  const handleAdd = async () => {
    if (!selMet || !selForm) { onMessage("error", "Selectionnez un metier et une formation"); return; }
    try {
      const res = await fetch("/api/admin/metier-formations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ metierId: selMet, formationId: selForm }) });
      if (!res.ok) throw new Error();
      onMessage("success", "Lien cree"); setSelForm(""); onRefresh();
    } catch { onMessage("error", "Erreur (lien existe deja ?)"); }
  };

  const handleRemove = async (metId: string, formId: string) => {
    try {
      const res = await fetch(`/api/admin/metier-formations?metierId=${metId}&formationId=${formId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onMessage("success", "Lien supprime"); onRefresh();
    } catch { onMessage("error", "Erreur lors de la suppression"); }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-5">Liens Metier - Formation</h2>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm">Ajouter un lien</h3>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">Metier</label>
            <select value={selMet} onChange={(e) => setSelMet(e.target.value)} className={selectClass}>
              <option value="">-- Choisir --</option>
              {metiers.map((m) => <option key={m.id} value={m.id}>{m.nameFr} ({m.family})</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">Formation</label>
            <select value={selForm} onChange={(e) => setSelForm(e.target.value)} className={selectClass}>
              <option value="">-- Choisir --</option>
              {formations.map((f) => <option key={f.id} value={f.id}>{f.nameFr}</option>)}
            </select>
          </div>
          <button onClick={handleAdd} className="px-5 py-2.5 bg-[#1B2A5B] text-white rounded-xl text-sm font-semibold hover:bg-[#253672] transition-colors">
            Ajouter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="font-semibold text-gray-800 text-sm">Liens existants</h3>
          <div className="relative flex-1">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input type="text" value={filterMet} onChange={(e) => setFilterMet(e.target.value)} placeholder="Filtrer..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A5B]/20" />
          </div>
        </div>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {filteredMet.filter((m) => m.formations.length > 0).map((met) => (
            <div key={met.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
              <h4 className="font-medium text-gray-900 text-sm mb-2.5">
                {met.nameFr} <span className="text-gray-400 font-normal">- {met.family}</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {met.formations.map((mf) => (
                  <span key={mf.formation.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-purple-50 text-purple-700 border border-purple-100 font-medium">
                    {mf.formation.nameFr}
                    <button onClick={() => handleRemove(met.id, mf.formation.id)} className="text-purple-400 hover:text-red-500 transition-colors" title="Supprimer">
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
