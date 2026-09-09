import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize, expandQuery, matchesAll, suggest, buildSuggestionItems } from "../src/lib/search";

test("normalize retire accents, casse et ponctuation", () => {
  assert.equal(normalize("Électrotechnique (Lyon) — BTS"), "electrotechnique lyon bts");
  assert.equal(normalize("  Île-de-France "), "ile de france");
});

test("expandQuery élargit avec les synonymes du rail", () => {
  const [g] = expandQuery("conducteur");
  assert.ok(g.includes("conducteur") && g.includes("conduite") && g.includes("traction"));
  assert.deepEqual(expandQuery("a"), []); // mot trop court ignoré
});

test("matchesAll exige chaque mot, accepte un synonyme", () => {
  const hay = normalize("Formation TES conduite de train, Lyon");
  assert.equal(matchesAll(hay, expandQuery("conducteur lyon")), true);
  assert.equal(matchesAll(hay, expandQuery("conducteur lille")), false);
  assert.equal(matchesAll(normalize("Aiguilleur du rail"), expandQuery("circulation")), true);
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
  assert.ok(suggest(items, "circulation").some((i) => i.slug === "aiguilleur"), "synonyme métier");
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
  assert.equal(matchesAll(normalize("Formation TES conduite"), expandQuery("conducteur")), true);
});
