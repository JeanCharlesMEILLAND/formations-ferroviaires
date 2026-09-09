import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize, expandQuery, matchesAll, suggest, buildSuggestionItems } from "../src/lib/search";

test("normalize retire accents, casse et ponctuation", () => {
  assert.equal(normalize("Électrotechnique (Lyon) — BTS"), "electrotechnique lyon bts");
  assert.equal(normalize("  Île-de-France "), "ile de france");
});

test("expandQuery élargit avec les synonymes du rail", () => {
  const [g] = expandQuery("conducteur");
  assert.ok(g.includes("conducteur") && g.includes("conduite de train") && g.includes("conductrice"));
  assert.ok(!g.includes("train") && !g.includes("traction") && !g.includes("tes"), "« train », « traction » et « tes » élargissaient trop");
  assert.ok(!expandQuery("aiguilleur")[0].includes("signalisation"), "« signalisation » n'est pas un synonyme d'aiguilleur");
  assert.deepEqual(expandQuery("a"), []); // mot trop court ignoré
});

test("matchesAll exige chaque mot, accepte un synonyme", () => {
  const hay = normalize("Formation TES conduite de train, Lyon");
  assert.equal(matchesAll(hay, expandQuery("conducteur lyon")), true);
  assert.equal(matchesAll(hay, expandQuery("conducteur lille")), false);
  assert.equal(matchesAll(normalize("Agent de circulation ferroviaire"), expandQuery("aiguilleur")), true);
});

const items = buildSuggestionItems({
  establishments: [
    { slug: "cfa-lyon", name: "CFA Ferroviaire - Lyon", city: "Saint-Priest", lat: 45.7, lng: 4.9, count: 5 },
    { slug: "campus-lille", name: "CampusFER", city: "Grenay", lat: 50.4, lng: 2.7, count: 6 },
  ],
  formations: [{ slug: "bts-electrotechnique", nameFr: "BTS Électrotechnique", level: "BTS", count: 40 }],
  metiers: [{ slug: "aiguilleur", nameFr: "Aiguilleur / Aiguilleuse", family: "Gestion du trafic", count: 3 }],
  cities: [{ name: "Lyon", count: 12 }],
});

test("suggest classe par qualité de correspondance puis popularité", () => {
  const r = suggest(items, "elec");
  assert.equal(r[0].kind, "formation");
  assert.equal(r[0].slug, "bts-electrotechnique");
  const lyon = suggest(items, "lyon");
  assert.ok(lyon.some((i) => i.kind === "establishment" && i.slug === "cfa-lyon"));
  assert.ok(lyon.some((i) => i.kind === "city"));
  assert.equal(suggest(items, "zzz").length, 0);
  assert.ok(suggest(items, "aiguillage").some((i) => i.slug === "aiguilleur"), "synonyme métier");
});

test("un synonyme court ne matche qu'en mot entier et les familles suivent la meilleure note", () => {
  const idx = buildSuggestionItems({
    establishments: [{ slug: "efmo", name: "EFMO - École du Ferroviaire et des Mobilités", city: "Pérols", lat: 43.5, lng: 3.9, count: 43 }],
    formations: [{ slug: "titre-conducteur", nameFr: "Titre Pro Conducteur de train", level: "Bac", count: 12 }],
    metiers: [], cities: [],
  });
  const r = suggest(idx, "conduc");
  assert.equal(r[0].kind, "formation", "la formation bien notée passe devant");
  assert.ok(!r.some((i) => i.slug === "efmo"), "« tes » ne doit pas matcher « mobilités »");
  assert.equal(matchesAll(normalize("Formation TES conduite de train"), expandQuery("conducteur")), true, "« conduite de train » vaut conducteur");
  assert.equal(matchesAll(normalize("TES Maintenance infrastructure"), expandQuery("conducteur")), false, "un autre TES ne vaut pas conducteur");
});

import { editDistance, fuzzyHit, tolerance } from "../src/lib/search";

test("editDistance compte une faute, une inversion, et s'arrête au-delà de la borne", () => {
  assert.equal(editDistance("lyon", "lyon", 2), 0);
  assert.equal(editDistance("lyno", "lyon", 2), 1, "inversion");
  assert.equal(editDistance("electrotecnique", "electrotechnique", 2), 1, "lettre manquante");
  assert.equal(editDistance("aiguileur", "aiguilleur", 2), 1);
  assert.equal(editDistance("chat", "train", 1), 2, "au-delà de la borne : borne + 1");
});

test("tolérance : rien sous quatre lettres, une jusqu'à six, deux au-delà", () => {
  assert.equal(tolerance("bac"), 0);
  assert.equal(tolerance("lyon"), 1);
  assert.equal(tolerance("electrotechnique"), 2);
  assert.equal(tolerance("bac4"), 0, "les codes avec chiffres restent exacts");
});

test("fuzzyHit retrouve un mot ou un début de mot à une faute près", () => {
  const hay = normalize("BTS Électrotechnique, Lyon, maintenance des installations");
  assert.equal(fuzzyHit(hay, "electrotecnique"), true);
  assert.equal(fuzzyHit(hay, "electrotech"), true, "début de mot");
  assert.equal(fuzzyHit(hay, "lyno"), true);
  assert.equal(fuzzyHit(hay, "paris"), false);
  assert.equal(fuzzyHit(hay, "bts"), false, "trop court pour tolérer");
  assert.equal(matchesAll(hay, expandQuery("maintenace lyon"), true), true);
  assert.equal(matchesAll(hay, expandQuery("maintenace lyon")), false, "sans tolérance");
});

test("suggest tolère une faute mais classe l'exact devant", () => {
  const idx = buildSuggestionItems({
    establishments: [], cities: [],
    formations: [{ slug: "bts-electro", nameFr: "BTS Électrotechnique", level: "BTS", count: 40 }],
    metiers: [{ slug: "aiguilleur", nameFr: "Aiguilleur / Aiguilleuse", family: "Gestion du trafic", count: 3 }],
  });
  assert.equal(suggest(idx, "aiguileur")[0]?.slug, "aiguilleur");
  assert.equal(suggest(idx, "electrotecnique")[0]?.slug, "bts-electro");
});

import { matchesFields } from "../src/lib/search";

test("matchesFields : les mots hors nom et ville doivent tenir dans une même formation ou un même métier", () => {
  const head = normalize("CFA Ferroviaire - Lyon Saint-Priest");
  const items = [normalize("Bac Pro MELEC"), normalize("Conducteur / Conductrice de RER"), normalize("BTS Électrotechnique")];
  assert.equal(matchesFields(head, items, expandQuery("electrotechnique lyon")), true, "ville dans l'en-tête, formation dans un item");
  assert.equal(matchesFields(head, items, expandQuery("conducteur rer")), true, "les deux mots dans le même métier");
  assert.equal(matchesFields(head, items, expandQuery("conducteur train")), false, "« train » absent de l'item qui contient « conducteur »");
  assert.equal(matchesFields(head, [...items, normalize("Titre Pro Conducteur de train")], expandQuery("conducteur train")), true);
  assert.equal(matchesFields(head, items, expandQuery("electrotecnique"), true), true, "faute tolérée dans un item");
});
