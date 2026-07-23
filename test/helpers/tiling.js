"use strict";

// Shared helper for tiling-game solver tests: the tiling validator.
const assert = require("node:assert/strict");

// Assert that `rects` is a legal Patches-style tiling of `model` ({ rows, cols, seeds: [{ r, c, type, size|null }] }).
function assertValidTiling(model, rects) {
  const { rows, cols, seeds } = model;
  const n = rows * cols;
  assert.ok(Array.isArray(rects), "returns rectangles");
  assert.equal(rects.length, seeds.length, "one rectangle per seed");

  const owner = new Array(n).fill(-1);
  const usedSeed = new Set();

  for (const rc of rects) {
    assert.ok(rc.seed >= 0 && rc.seed < seeds.length, "valid seed index");
    assert.ok(!usedSeed.has(rc.seed), "each seed used once");
    usedSeed.add(rc.seed);

    assert.ok(
      rc.top >= 0 && rc.left >= 0 && rc.bottom < rows && rc.right < cols && rc.top <= rc.bottom && rc.left <= rc.right,
      "rectangle lies within the grid"
    );

    const s = seeds[rc.seed];
    const w = rc.right - rc.left + 1;
    const h = rc.bottom - rc.top + 1;
    const area = w * h;

    assert.ok(s.r >= rc.top && s.r <= rc.bottom && s.c >= rc.left && s.c <= rc.right, "seed lies in its rectangle");

    let inside = 0;
    for (const o of seeds) {
      if (o.r >= rc.top && o.r <= rc.bottom && o.c >= rc.left && o.c <= rc.right) inside++;
    }
    assert.equal(inside, 1, "exactly one seed per rectangle");

    if (s.size != null) assert.equal(area, s.size, "area matches the seed number");
    if (s.type === "square") assert.equal(w, h, "square is w == h");
    if (s.type === "wide") assert.ok(w > h, "wide is w > h");
    if (s.type === "tall") assert.ok(h > w, "tall is h > w");

    for (let r = rc.top; r <= rc.bottom; r++) {
      for (let c = rc.left; c <= rc.right; c++) {
        const i = r * cols + c;
        assert.equal(owner[i], -1, "no overlap");
        owner[i] = rc.seed;
      }
    }
  }

  assert.ok(owner.every((x) => x !== -1), "covers every cell");
}

module.exports = { assertValidTiling };
