"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================================
// Types
// ============================================================

interface Region {
  id: string;
  name: string;
  code: string;
}
interface EstType {
  id: string;
  slug: string;
  nameFr: string;
  color: string;
}
interface Level {
  id: string;
  slug: string;
  nameFr: string;
  order: number;
}
interface Domain {
  id: string;
  slug: string;
  nameFr: string;
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
  level: Level;
  domain: Domain;
  establishments: Array<{
    establishment: { id: string; name: string; city: string };
  }>;
  metiers: Array<{ metier: { id: string; nameFr: string } }>;
}
interface Establishment {
  id: string;
  slug: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  website: string | null;
  address: string | null;
  type: EstType;
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
  formations: Array<{ formation: { id: string; nameFr: string; slug: string } }>;
}

type Tab = "establishments" | "formations" | "metiers" | "links-ef" | "links-mf";

// ============================================================
// Admin Page
// ============================================================

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("establishments");
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [estRes, formRes, metRes, filterRes] = await Promise.all([
        fetch("/api/admin/establishments"),
        fetch("/api/admin/formations"),
        fetch("/api/admin/metiers"),
        fetch("/api/filters"),
      ]);
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
    loadData();
  }, [loadData]);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "establishments", label: "Etablissements", count: establishments.length },
    { key: "formations", label: "Formations", count: formations.length },
    { key: "metiers", label: "Metiers", count: metiers.length },
    { key: "links-ef", label: "Liens Etab-Form", count: establishments.reduce((s, e) => s + e.formations.length, 0) },
    { key: "links-mf", label: "Liens Metier-Form", count: metiers.reduce((s, m) => s + m.formations.length, 0) },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Administration - Formations Ferroviaires</h1>
          <a href="/fr" className="text-sm text-blue-600 hover:underline">Voir la carte</a>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium ${message.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        <div className="flex gap-1 bg-white rounded-lg shadow-sm p-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.key
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Chargement...</div>
        ) : (
          <>
            {tab === "establishments" && (
              <EstablishmentsTab
                establishments={establishments}
                regions={regions}
                types={types}
                onRefresh={loadData}
                onMessage={showMessage}
              />
            )}
            {tab === "formations" && (
              <FormationsTab
                formations={formations}
                levels={levels}
                domains={domains}
                onRefresh={loadData}
                onMessage={showMessage}
              />
            )}
            {tab === "metiers" && (
              <MetiersTab
                metiers={metiers}
                onRefresh={loadData}
                onMessage={showMessage}
              />
            )}
            {tab === "links-ef" && (
              <LinksEFTab
                establishments={establishments}
                formations={formations}
                onRefresh={loadData}
                onMessage={showMessage}
              />
            )}
            {tab === "links-mf" && (
              <LinksMFTab
                metiers={metiers}
                formations={formations}
                onRefresh={loadData}
                onMessage={showMessage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Establishments Tab
// ============================================================

function EstablishmentsTab({
  establishments,
  regions,
  types,
  onRefresh,
  onMessage,
}: {
  establishments: Establishment[];
  regions: Region[];
  types: EstType[];
  onRefresh: () => void;
  onMessage: (type: "success" | "error", text: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", city: "", lat: "", lng: "", typeId: "", regionId: "", website: "", address: "",
  });

  const filtered = establishments.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.city.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setForm({ name: "", city: "", lat: "", lng: "", typeId: "", regionId: "", website: "", address: "" });
    setEditId(null);
    setShowForm(false);
  };

  const startEdit = (est: Establishment) => {
    setForm({
      name: est.name,
      city: est.city,
      lat: String(est.lat),
      lng: String(est.lng),
      typeId: est.type.id,
      regionId: est.region.id,
      website: est.website || "",
      address: est.address || "",
    });
    setEditId(est.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.city || !form.lat || !form.lng || !form.typeId || !form.regionId) {
      onMessage("error", "Champs obligatoires manquants");
      return;
    }
    try {
      const url = editId ? `/api/admin/establishments/${editId}` : "/api/admin/establishments";
      const res = await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      onMessage("success", editId ? "Etablissement modifie" : "Etablissement cree");
      resetForm();
      onRefresh();
    } catch {
      onMessage("error", "Erreur lors de la sauvegarde");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    try {
      const res = await fetch(`/api/admin/establishments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onMessage("success", "Etablissement supprime");
      onRefresh();
    } catch {
      onMessage("error", "Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="flex-1 px-3 py-2 border rounded-lg text-sm"
        />
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Ajouter
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <h3 className="font-semibold text-gray-800">{editId ? "Modifier" : "Ajouter"} un etablissement</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input placeholder="Nom *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 border rounded text-sm col-span-2" />
            <input placeholder="Ville *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="px-3 py-2 border rounded text-sm" />
            <input placeholder="Adresse" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="px-3 py-2 border rounded text-sm" />
            <input placeholder="Latitude *" type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} className="px-3 py-2 border rounded text-sm" />
            <input placeholder="Longitude *" type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} className="px-3 py-2 border rounded text-sm" />
            <select value={form.typeId} onChange={(e) => setForm({ ...form, typeId: e.target.value })} className="px-3 py-2 border rounded text-sm">
              <option value="">Type *</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.nameFr}</option>)}
            </select>
            <select value={form.regionId} onChange={(e) => setForm({ ...form, regionId: e.target.value })} className="px-3 py-2 border rounded text-sm">
              <option value="">Region *</option>
              {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <input placeholder="Site web" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="px-3 py-2 border rounded text-sm col-span-2" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700">
              {editId ? "Sauvegarder" : "Creer"}
            </button>
            <button onClick={resetForm} className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300">
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600">Nom</th>
              <th className="px-4 py-3 font-medium text-gray-600">Ville</th>
              <th className="px-4 py-3 font-medium text-gray-600">Region</th>
              <th className="px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="px-4 py-3 font-medium text-gray-600">Formations</th>
              <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((est) => (
              <tr key={est.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{est.name}</td>
                <td className="px-4 py-3 text-gray-600">{est.city}</td>
                <td className="px-4 py-3 text-gray-600">{est.region.name}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: est.type.color }}>
                    {est.type.nameFr}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{est.formations.length}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(est)} className="text-blue-600 hover:underline text-xs">Modifier</button>
                    <button onClick={() => handleDelete(est.id, est.name)} className="text-red-600 hover:underline text-xs">Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Formations Tab
// ============================================================

function FormationsTab({
  formations,
  levels,
  domains,
  onRefresh,
  onMessage,
}: {
  formations: Formation[];
  levels: Level[];
  domains: Domain[];
  onRefresh: () => void;
  onMessage: (type: "success" | "error", text: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    nameFr: "", nameEn: "", rncpCode: "", levelId: "", domainId: "", jobTarget: "", onisepUrl: "",
  });

  const filtered = formations.filter((f) =>
    f.nameFr.toLowerCase().includes(search.toLowerCase()) ||
    (f.rncpCode && f.rncpCode.includes(search))
  );

  const resetForm = () => {
    setForm({ nameFr: "", nameEn: "", rncpCode: "", levelId: "", domainId: "", jobTarget: "", onisepUrl: "" });
    setEditId(null);
    setShowForm(false);
  };

  const startEdit = (f: Formation) => {
    setForm({
      nameFr: f.nameFr,
      nameEn: f.nameEn || "",
      rncpCode: f.rncpCode || "",
      levelId: f.level.id,
      domainId: f.domain.id,
      jobTarget: f.jobTarget || "",
      onisepUrl: f.onisepUrl || "",
    });
    setEditId(f.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.nameFr || !form.levelId || !form.domainId) {
      onMessage("error", "Champs obligatoires manquants");
      return;
    }
    try {
      const url = editId ? `/api/admin/formations/${editId}` : "/api/admin/formations";
      const res = await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      onMessage("success", editId ? "Formation modifiee" : "Formation creee");
      resetForm();
      onRefresh();
    } catch {
      onMessage("error", "Erreur lors de la sauvegarde");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    try {
      const res = await fetch(`/api/admin/formations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onMessage("success", "Formation supprimee");
      onRefresh();
    } catch {
      onMessage("error", "Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou code RNCP..."
          className="flex-1 px-3 py-2 border rounded-lg text-sm"
        />
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Ajouter
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <h3 className="font-semibold text-gray-800">{editId ? "Modifier" : "Ajouter"} une formation</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input placeholder="Nom FR *" value={form.nameFr} onChange={(e) => setForm({ ...form, nameFr: e.target.value })} className="px-3 py-2 border rounded text-sm col-span-2" />
            <input placeholder="Nom EN" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="px-3 py-2 border rounded text-sm col-span-2" />
            <input placeholder="Code RNCP" value={form.rncpCode} onChange={(e) => setForm({ ...form, rncpCode: e.target.value })} className="px-3 py-2 border rounded text-sm" />
            <select value={form.levelId} onChange={(e) => setForm({ ...form, levelId: e.target.value })} className="px-3 py-2 border rounded text-sm">
              <option value="">Niveau *</option>
              {levels.map((l) => <option key={l.id} value={l.id}>{l.nameFr}</option>)}
            </select>
            <select value={form.domainId} onChange={(e) => setForm({ ...form, domainId: e.target.value })} className="px-3 py-2 border rounded text-sm">
              <option value="">Domaine *</option>
              {domains.map((d) => <option key={d.id} value={d.id}>{d.nameFr}</option>)}
            </select>
            <input placeholder="URL ONISEP" value={form.onisepUrl} onChange={(e) => setForm({ ...form, onisepUrl: e.target.value })} className="px-3 py-2 border rounded text-sm" />
            <input placeholder="Metier vise" value={form.jobTarget} onChange={(e) => setForm({ ...form, jobTarget: e.target.value })} className="px-3 py-2 border rounded text-sm col-span-2 md:col-span-4" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700">
              {editId ? "Sauvegarder" : "Creer"}
            </button>
            <button onClick={resetForm} className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300">
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600">Nom</th>
              <th className="px-4 py-3 font-medium text-gray-600">RNCP</th>
              <th className="px-4 py-3 font-medium text-gray-600">Niveau</th>
              <th className="px-4 py-3 font-medium text-gray-600">Domaine</th>
              <th className="px-4 py-3 font-medium text-gray-600">Etab.</th>
              <th className="px-4 py-3 font-medium text-gray-600">Metiers</th>
              <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{f.nameFr}</td>
                <td className="px-4 py-3 text-gray-600">{f.rncpCode || "-"}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{f.level.nameFr}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: f.domain.color }}>
                    {f.domain.nameFr}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{f.establishments.length}</td>
                <td className="px-4 py-3 text-gray-600">{f.metiers.length}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(f)} className="text-blue-600 hover:underline text-xs">Modifier</button>
                    <button onClick={() => handleDelete(f.id, f.nameFr)} className="text-red-600 hover:underline text-xs">Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Metiers Tab
// ============================================================

function MetiersTab({
  metiers,
  onRefresh,
  onMessage,
}: {
  metiers: Metier[];
  onRefresh: () => void;
  onMessage: (type: "success" | "error", text: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    nameFr: "", nameEn: "", family: "", source: "futurentrain", level: "",
  });

  const families = Array.from(new Set(metiers.map((m) => m.family))).sort();
  const filtered = metiers.filter((m) =>
    m.nameFr.toLowerCase().includes(search.toLowerCase()) ||
    m.family.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setForm({ nameFr: "", nameEn: "", family: "", source: "futurentrain", level: "" });
    setEditId(null);
    setShowForm(false);
  };

  const startEdit = (m: Metier) => {
    setForm({
      nameFr: m.nameFr,
      nameEn: m.nameEn || "",
      family: m.family,
      source: m.source,
      level: m.level || "",
    });
    setEditId(m.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.nameFr || !form.family || !form.source) {
      onMessage("error", "Champs obligatoires manquants");
      return;
    }
    try {
      const url = editId ? `/api/admin/metiers/${editId}` : "/api/admin/metiers";
      const res = await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      onMessage("success", editId ? "Metier modifie" : "Metier cree");
      resetForm();
      onRefresh();
    } catch {
      onMessage("error", "Erreur lors de la sauvegarde");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    try {
      const res = await fetch(`/api/admin/metiers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onMessage("success", "Metier supprime");
      onRefresh();
    } catch {
      onMessage("error", "Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un metier..."
          className="flex-1 px-3 py-2 border rounded-lg text-sm"
        />
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Ajouter
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <h3 className="font-semibold text-gray-800">{editId ? "Modifier" : "Ajouter"} un metier</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input placeholder="Nom FR *" value={form.nameFr} onChange={(e) => setForm({ ...form, nameFr: e.target.value })} className="px-3 py-2 border rounded text-sm col-span-2" />
            <input placeholder="Nom EN" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="px-3 py-2 border rounded text-sm col-span-2" />
            <input placeholder="Famille *" value={form.family} onChange={(e) => setForm({ ...form, family: e.target.value })} className="px-3 py-2 border rounded text-sm" list="families" />
            <datalist id="families">
              {families.map((f) => <option key={f} value={f} />)}
            </datalist>
            <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="px-3 py-2 border rounded text-sm">
              <option value="futurentrain">futurentrain</option>
              <option value="aveclindustrieferroviaire">aveclindustrieferroviaire</option>
            </select>
            <input placeholder="Niveau (CAP, BAC, BAC+2...)" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="px-3 py-2 border rounded text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700">
              {editId ? "Sauvegarder" : "Creer"}
            </button>
            <button onClick={resetForm} className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300">
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600">Nom</th>
              <th className="px-4 py-3 font-medium text-gray-600">Famille</th>
              <th className="px-4 py-3 font-medium text-gray-600">Source</th>
              <th className="px-4 py-3 font-medium text-gray-600">Niveau</th>
              <th className="px-4 py-3 font-medium text-gray-600">Formations</th>
              <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{m.nameFr}</td>
                <td className="px-4 py-3 text-gray-600">{m.family}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{m.source}</td>
                <td className="px-4 py-3 text-gray-600">{m.level || "-"}</td>
                <td className="px-4 py-3 text-gray-600">{m.formations.length}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(m)} className="text-blue-600 hover:underline text-xs">Modifier</button>
                    <button onClick={() => handleDelete(m.id, m.nameFr)} className="text-red-600 hover:underline text-xs">Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Links Establishment-Formation Tab
// ============================================================

function LinksEFTab({
  establishments,
  formations,
  onRefresh,
  onMessage,
}: {
  establishments: Establishment[];
  formations: Formation[];
  onRefresh: () => void;
  onMessage: (type: "success" | "error", text: string) => void;
}) {
  const [selEst, setSelEst] = useState("");
  const [selForm, setSelForm] = useState("");
  const [filterEst, setFilterEst] = useState("");

  const filteredEst = establishments.filter(
    (e) =>
      e.name.toLowerCase().includes(filterEst.toLowerCase()) ||
      e.city.toLowerCase().includes(filterEst.toLowerCase())
  );

  const handleAdd = async () => {
    if (!selEst || !selForm) {
      onMessage("error", "Selectionnez un etablissement et une formation");
      return;
    }
    try {
      const res = await fetch("/api/admin/establishment-formations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ establishmentId: selEst, formationId: selForm }),
      });
      if (!res.ok) throw new Error();
      onMessage("success", "Lien cree");
      setSelForm("");
      onRefresh();
    } catch {
      onMessage("error", "Erreur (lien existe deja ?)");
    }
  };

  const handleRemove = async (estId: string, formId: string) => {
    try {
      const res = await fetch(
        `/api/admin/establishment-formations?establishmentId=${estId}&formationId=${formId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      onMessage("success", "Lien supprime");
      onRefresh();
    } catch {
      onMessage("error", "Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-4">
      {/* Add link form */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Ajouter un lien Etablissement - Formation</h3>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 mb-1 block">Etablissement</label>
            <select value={selEst} onChange={(e) => setSelEst(e.target.value)} className="w-full px-3 py-2 border rounded text-sm">
              <option value="">-- Choisir --</option>
              {establishments.map((e) => (
                <option key={e.id} value={e.id}>{e.name} ({e.city})</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 mb-1 block">Formation</label>
            <select value={selForm} onChange={(e) => setSelForm(e.target.value)} className="w-full px-3 py-2 border rounded text-sm">
              <option value="">-- Choisir --</option>
              {formations.map((f) => (
                <option key={f.id} value={f.id}>{f.nameFr}</option>
              ))}
            </select>
          </div>
          <button onClick={handleAdd} className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700">
            Ajouter
          </button>
        </div>
      </div>

      {/* Existing links */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="font-semibold text-gray-800">Liens existants</h3>
          <input
            type="text"
            value={filterEst}
            onChange={(e) => setFilterEst(e.target.value)}
            placeholder="Filtrer par etablissement..."
            className="flex-1 px-3 py-2 border rounded text-sm"
          />
        </div>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {filteredEst
            .filter((e) => e.formations.length > 0)
            .map((est) => (
              <div key={est.id} className="border rounded-lg p-3">
                <h4 className="font-medium text-gray-900 text-sm mb-2">
                  {est.name} <span className="text-gray-400">({est.city})</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {est.formations.map((ef) => (
                    <span
                      key={ef.formation.id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {ef.formation.nameFr}
                      <button
                        onClick={() => handleRemove(est.id, ef.formation.id)}
                        className="text-red-400 hover:text-red-600 ml-1"
                        title="Supprimer ce lien"
                      >
                        x
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
  metiers,
  formations,
  onRefresh,
  onMessage,
}: {
  metiers: Metier[];
  formations: Formation[];
  onRefresh: () => void;
  onMessage: (type: "success" | "error", text: string) => void;
}) {
  const [selMet, setSelMet] = useState("");
  const [selForm, setSelForm] = useState("");
  const [filterMet, setFilterMet] = useState("");

  const filteredMet = metiers.filter((m) =>
    m.nameFr.toLowerCase().includes(filterMet.toLowerCase()) ||
    m.family.toLowerCase().includes(filterMet.toLowerCase())
  );

  const handleAdd = async () => {
    if (!selMet || !selForm) {
      onMessage("error", "Selectionnez un metier et une formation");
      return;
    }
    try {
      const res = await fetch("/api/admin/metier-formations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metierId: selMet, formationId: selForm }),
      });
      if (!res.ok) throw new Error();
      onMessage("success", "Lien cree");
      setSelForm("");
      onRefresh();
    } catch {
      onMessage("error", "Erreur (lien existe deja ?)");
    }
  };

  const handleRemove = async (metId: string, formId: string) => {
    try {
      const res = await fetch(
        `/api/admin/metier-formations?metierId=${metId}&formationId=${formId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      onMessage("success", "Lien supprime");
      onRefresh();
    } catch {
      onMessage("error", "Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-4">
      {/* Add link form */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Ajouter un lien Metier - Formation</h3>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 mb-1 block">Metier</label>
            <select value={selMet} onChange={(e) => setSelMet(e.target.value)} className="w-full px-3 py-2 border rounded text-sm">
              <option value="">-- Choisir --</option>
              {metiers.map((m) => (
                <option key={m.id} value={m.id}>{m.nameFr} ({m.family})</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 mb-1 block">Formation</label>
            <select value={selForm} onChange={(e) => setSelForm(e.target.value)} className="w-full px-3 py-2 border rounded text-sm">
              <option value="">-- Choisir --</option>
              {formations.map((f) => (
                <option key={f.id} value={f.id}>{f.nameFr}</option>
              ))}
            </select>
          </div>
          <button onClick={handleAdd} className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700">
            Ajouter
          </button>
        </div>
      </div>

      {/* Existing links */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="font-semibold text-gray-800">Liens existants</h3>
          <input
            type="text"
            value={filterMet}
            onChange={(e) => setFilterMet(e.target.value)}
            placeholder="Filtrer par metier..."
            className="flex-1 px-3 py-2 border rounded text-sm"
          />
        </div>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {filteredMet
            .filter((m) => m.formations.length > 0)
            .map((met) => (
              <div key={met.id} className="border rounded-lg p-3">
                <h4 className="font-medium text-gray-900 text-sm mb-2">
                  {met.nameFr} <span className="text-gray-400">({met.family})</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {met.formations.map((mf) => (
                    <span
                      key={mf.formation.id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-50 text-purple-700 border border-purple-200"
                    >
                      {mf.formation.nameFr}
                      <button
                        onClick={() => handleRemove(met.id, mf.formation.id)}
                        className="text-red-400 hover:text-red-600 ml-1"
                        title="Supprimer ce lien"
                      >
                        x
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
