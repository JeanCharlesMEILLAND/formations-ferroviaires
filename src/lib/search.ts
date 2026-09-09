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
  // Un synonyme est un équivalent du même métier ou du même diplôme, jamais un domaine voisin :
  // « signalisation » pour « aiguilleur » ramenait tous les techniciens en signalisation.
  conducteur: ["conductrice", "conduite de train", "licence europeenne de conducteur"],
  conductrice: ["conducteur", "conduite de train"],
  conduite: ["conducteur"],
  aiguilleur: ["aiguilleuse", "agent de circulation"],
  aiguilleuse: ["aiguilleur", "agent de circulation"],
  aiguillage: ["aiguilleur", "agent de circulation"],
  circulation: ["aiguilleur"],
  regulateur: ["regulatrice"],
  regulatrice: ["regulateur"],
  cheminot: ["ferroviaire"],
  sncf: ["ferroviaire"],
  rail: ["ferroviaire"],
  rails: ["voie ferree", "infrastructure"],
  voie: ["voie ferree", "travaux publics"],
  apprentissage: ["cfa", "alternance"],
  alternance: ["cfa", "apprentissage"],
  ingenieur: ["ingenieurs", "ingenieure"],
  ingenieure: ["ingenieur", "ingenieurs"],
  bac: ["baccalaureat", "bac pro"],
  electricien: ["electrotechnique", "melec", "electricienne"],
  electricienne: ["electrotechnique", "melec", "electricien"],
  electricite: ["electrotechnique", "melec"],
  mecanicien: ["mecanique", "mspc", "maintenance des vehicules", "maintenance des systemes"],
  mecanicienne: ["mecanique", "mspc", "maintenance des vehicules"],
  securite: ["secufer"],
  fret: ["marchandises", "manoeuvre"],
  soudeur: ["chaudronnier", "soudage"],
  soudeuse: ["chaudronnier", "soudage"],
  reconversion: ["certification", "secufer"],
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

/**
 * Distance d'édition (Damerau-Levenshtein, alignement optimal) bornée : au-delà de `max`, on renvoie max + 1
 * sans finir le calcul. Une lettre en trop, en moins, changée ou deux lettres inversées comptent 1.
 */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [], prev: number[] = [], cur: number[] = [];
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev; prev = cur;
  }
  return prev[b.length];
}

/** Tolérance admise pour un mot tapé : aucune sous quatre lettres, une jusqu'à six, deux au-delà. */
export const tolerance = (token: string): number => (token.length < 4 || /\d/.test(token) ? 0 : token.length <= 6 ? 1 : 2);

/** Vrai si un mot du texte, ou le début d'un mot plus long, est à une faute près du terme tapé. */
export function fuzzyHit(haystack: string, token: string): boolean {
  const max = tolerance(token);
  if (max === 0) return false;
  for (const w of haystack.split(" ")) {
    if (w.length < 4) continue;
    if (editDistance(token, w, max) <= max) return true;
    if (token.length >= 5 && w.length > token.length && editDistance(token, w.slice(0, token.length), max) <= max) return true;
  }
  return false;
}

/** Vrai si chaque groupe de la requête trouve au moins une alternative dans le texte normalisé (à une faute près si `fuzzy`). */
export function matchesAll(haystack: string, groups: string[][], fuzzy = false): boolean {
  return groups.every((alts) => alts.some((a) => hit(haystack, a)) || (fuzzy && fuzzyHit(haystack, alts[0])));
}

/**
 * Correspondance par champs : chaque mot doit se trouver dans l'en-tête (nom et ville), et les mots restants
 * doivent tous figurer dans une même entité (une formation ou un métier). « conducteur train » ne peut donc plus
 * réunir « conducteur » pris dans un métier et « train » pris dans une autre formation.
 */
export function matchesFields(head: string, items: string[], groups: string[][], fuzzy = false): boolean {
  const rest = groups.filter((alts) => !(alts.some((a) => hit(head, a)) || (fuzzy && fuzzyHit(head, alts[0]))));
  if (rest.length === 0) return true;
  return items.some((it) => matchesAll(it, rest, fuzzy));
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

/** Qualité d'une correspondance : début du texte > début d'un mot > au milieu d'un mot > synonyme > à une faute près. */
function quality(n: string, token: string, alts: string[]): number {
  if (n.startsWith(token)) return 5;
  if (n.includes(` ${token}`)) return 4;
  if (hit(n, token)) return 3;
  if (alts.some((a) => hit(n, a))) return 2;
  return fuzzyHit(n, token) ? 1 : 0;
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
