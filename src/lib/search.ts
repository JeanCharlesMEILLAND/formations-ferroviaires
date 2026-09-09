/**
 * Moteur de recherche isomorphe (serveur et navigateur) : normalisation sans accents, synonymes du secteur,
 * correspondance par mots et classement des suggestions. Fonctions pures, testées dans tests/search.test.ts.
 */

/** Minuscules, sans accents ni ponctuation : « Électrotechnique (Lyon) » → « electrotechnique lyon ». */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Vocabulaire du rail : chaque entrée élargit un mot tapé aux termes voisins présents dans les fiches. */
export const SYNONYMS: Record<string, string[]> = {
  conducteur: ["conduite", "traction", "tes", "licence europeenne", "train"],
  conductrice: ["conduite", "traction", "tes", "train"],
  conduite: ["conducteur", "traction", "tes"],
  aiguilleur: ["circulation", "trafic", "signalisation", "regulateur"],
  aiguilleuse: ["circulation", "trafic", "signalisation"],
  aiguillage: ["circulation", "signalisation"],
  circulation: ["trafic", "aiguilleur", "regulateur"],
  catenaire: ["installations fixes", "traction electrique", "electrotechnique", "melec"],
  signalisation: ["ses", "signalisation", "circulation", "automatismes"],
  voie: ["travaux publics", "infrastructure", "installations ferroviaires", "chantier"],
  rails: ["voie", "infrastructure"],
  cheminot: ["ferroviaire"],
  sncf: ["ferroviaire", "campus"],
  rail: ["ferroviaire"],
  apprentissage: ["cfa", "alternance"],
  alternance: ["cfa", "apprentissage"],
  ingenieur: ["ingenieurs", "master", "mastere", "ecole"],
  ingenieure: ["ingenieurs", "master", "mastere"],
  bac: ["baccalaureat", "bac pro"],
  electricien: ["electrotechnique", "melec", "electrique"],
  electricite: ["electrotechnique", "melec", "electrique"],
  mecanicien: ["maintenance", "mecanique", "mspc"],
  mecanique: ["maintenance", "mspc"],
  securite: ["secufer", "securite ferroviaire"],
  fret: ["marchandises", "manoeuvre", "logistique"],
  logistique: ["fret", "transport"],
  soudeur: ["chaudronnier", "soudage"],
  reconversion: ["certification", "secufer", "tes", "licence"],
};

/** Découpe la requête en groupes d'alternatives : [["conduc", "conduite", "traction", …], ["lyon"]]. */
export function expandQuery(q: string): string[][] {
  const tokens = normalize(q).split(" ").filter((t) => t.length >= 2);
  return tokens.map((t) => {
    const alts = new Set<string>([t]);
    for (const [key, list] of Object.entries(SYNONYMS)) {
      if (key.startsWith(t) && t.length >= 4) for (const a of list) alts.add(a);
      if (t.startsWith(key)) for (const a of list) alts.add(a);
    }
    return Array.from(alts);
  });
}

/** Un terme court (moins de quatre lettres) ne compte que comme mot entier : « tes » ne doit pas matcher « mobilités ». */
function hit(haystack: string, term: string): boolean {
  return term.length >= 4 ? haystack.includes(term) : ` ${haystack} `.includes(` ${term} `);
}

/** Vrai si chaque groupe de la requête trouve au moins une alternative dans le texte normalisé. */
export function matchesAll(haystack: string, groups: string[][]): boolean {
  return groups.every((alts) => alts.some((a) => hit(haystack, a)));
}

export type SuggestionKind = "establishment" | "formation" | "metier" | "city";
export interface SuggestionItem {
  kind: SuggestionKind;
  slug: string;
  label: string;
  sub?: string;
  /** Texte normalisé sur lequel on cherche. */
  n: string;
  /** Poids de popularité (nombre d'établissements, etc.). */
  weight?: number;
  lat?: number;
  lng?: number;
}

/** Qualité d'une correspondance : début du texte > début d'un mot > au milieu d'un mot > synonyme seul. */
function quality(n: string, token: string, alts: string[]): number {
  if (n.startsWith(token)) return 4;
  if (n.includes(` ${token}`)) return 3;
  if (hit(n, token)) return 2;
  return alts.some((a) => hit(n, a)) ? 1 : 0;
}

const KIND_ORDER: Record<SuggestionKind, number> = { establishment: 0, formation: 1, metier: 2, city: 3 };
const KIND_MAX: Record<SuggestionKind, number> = { establishment: 4, formation: 3, metier: 3, city: 2 };

/** Suggestions classées et plafonnées par famille, pour la liste sous le champ de recherche. */
export function suggest(items: SuggestionItem[], q: string, limit = 10): SuggestionItem[] {
  const groups = expandQuery(q);
  if (groups.length === 0) return [];
  const scored: Array<{ item: SuggestionItem; score: number }> = [];
  for (const item of items) {
    let score = 0;
    let ok = true;
    for (const alts of groups) {
      const s = quality(item.n, alts[0], alts);
      if (s === 0) { ok = false; break; }
      score += s;
    }
    if (!ok) continue;
    score = score * 10 + Math.min(9, Math.log2((item.weight ?? 1) + 1));
    scored.push({ item, score });
  }
  scored.sort((a, b) => b.score - a.score || KIND_ORDER[a.item.kind] - KIND_ORDER[b.item.kind] || a.item.label.localeCompare(b.item.label));
  // Plafond par famille, puis familles ordonnées par leur meilleure note : une formation bien notée passe devant
  // des établissements qui ne matchent que par synonyme.
  const perKind: Record<string, number> = {};
  const kept: Array<{ item: SuggestionItem; score: number }> = [];
  for (const entry of scored) {
    const k = entry.item.kind;
    perKind[k] = (perKind[k] ?? 0) + 1;
    if (perKind[k] > KIND_MAX[k]) continue;
    kept.push(entry);
    if (kept.length >= limit) break;
  }
  const best: Record<string, number> = {};
  for (const e of kept) best[e.item.kind] = Math.max(best[e.item.kind] ?? 0, e.score);
  kept.sort((a, b) => best[b.item.kind] - best[a.item.kind] || KIND_ORDER[a.item.kind] - KIND_ORDER[b.item.kind] || b.score - a.score);
  return kept.map((e) => e.item);
}

/** Index de suggestions construit à partir des données publiques (/api/search-index). */
export interface SearchIndexData {
  establishments: Array<{ slug: string; name: string; city: string; lat: number; lng: number; count: number }>;
  formations: Array<{ slug: string; nameFr: string; level: string; count: number }>;
  metiers: Array<{ slug: string; nameFr: string; family: string; count: number }>;
  cities: Array<{ name: string; count: number }>;
}

export function buildSuggestionItems(data: SearchIndexData, displayName: (s: string) => string = (s) => s): SuggestionItem[] {
  const items: SuggestionItem[] = [];
  for (const e of data.establishments) items.push({ kind: "establishment", slug: e.slug, label: displayName(e.name), sub: e.city, n: normalize(`${e.name} ${e.city}`), weight: e.count, lat: e.lat, lng: e.lng });
  for (const f of data.formations) items.push({ kind: "formation", slug: f.slug, label: f.nameFr, sub: f.level, n: normalize(f.nameFr), weight: f.count });
  for (const m of data.metiers) items.push({ kind: "metier", slug: m.slug, label: m.nameFr, sub: m.family, n: normalize(m.nameFr), weight: m.count });
  for (const c of data.cities) items.push({ kind: "city", slug: c.name, label: c.name, n: normalize(c.name), weight: c.count });
  return items;
}
