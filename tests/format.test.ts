import { test } from "node:test";
import assert from "node:assert/strict";
import { displayName } from "../src/lib/format";

test("displayName remet en minuscules les noms tout en capitales, garde les sigles", () => {
  assert.equal(displayName("CAMPUS MECATEAM"), "Campus Mecateam");
  assert.equal(displayName("CFA Ferroviaire - Lyon"), "CFA Ferroviaire - Lyon");
  assert.equal(displayName("IUT DE BREST"), "IUT de Brest");
});
