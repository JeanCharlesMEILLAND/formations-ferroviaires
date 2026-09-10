import test from "node:test";
import assert from "node:assert/strict";
import { bounds, lambertProjector, metersProjector, simplifyLine, svgPath, type XY } from "../src/lib/geo";

test("la projection Lambert place l'origine (3° E, 46,5° N) en (0, 0) et oriente le nord vers le haut", () => {
  const proj = lambertProjector();
  const [x0, y0] = proj([3, 46.5]);
  assert.ok(Math.abs(x0) < 1e-9 && Math.abs(y0) < 1e-9);
  const lille = proj([3.06, 50.63]), marseille = proj([5.37, 43.3]), brest = proj([-4.49, 48.39]);
  assert.ok(lille[1] > 0 && marseille[1] < 0, "le nord a une ordonnée positive");
  assert.ok(brest[0] < 0 && marseille[0] > 0, "l'ouest a une abscisse négative");
});

test("la métrique locale donne environ 111 km par degré de latitude et 76 km par degré de longitude à 46,6° N", () => {
  const m = metersProjector();
  const [, y1] = m([0, 46]), [, y2] = m([0, 47]);
  const [x1] = m([2, 46.6]), [x2] = m([3, 46.6]);
  assert.ok(Math.abs(y2 - y1 - 110540) < 1);
  assert.ok(Math.abs(x2 - x1 - 76500) < 500);
});

test("Douglas-Peucker garde les extrémités, supprime les points alignés et respecte la tolérance", () => {
  const straight: XY[] = [[0, 0], [1, 0.01], [2, -0.01], [3, 0], [4, 0]];
  assert.deepEqual(simplifyLine(straight, 0.1), [[0, 0], [4, 0]]);
  const bent: XY[] = [[0, 0], [1, 0], [2, 3], [3, 0], [4, 0]];
  assert.deepEqual(simplifyLine(bent, 0.5), [[0, 0], [1, 0], [2, 3], [3, 0], [4, 0]]);
  assert.deepEqual(simplifyLine(bent, 10), [[0, 0], [4, 0]]);
  assert.deepEqual(simplifyLine([[1, 1], [2, 2]], 5), [[1, 1], [2, 2]]);
});

test("emprise et chemin SVG", () => {
  const pts: XY[] = [[1.26, 2.34], [3.16, 0.5]];
  assert.deepEqual(bounds(pts), { minX: 1.26, minY: 0.5, maxX: 3.16, maxY: 2.34 });
  assert.equal(svgPath(pts), "M1.3 2.3L3.2 0.5");
  assert.equal(svgPath(pts, 2, true), "M1.26 2.34L3.16 0.50Z");
  assert.equal(svgPath([]), "");
});
