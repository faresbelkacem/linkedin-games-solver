"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { assertValidTiling } = require("../../helpers/tiling");

global.window = global.window || {};
require("../../../src/games/patches/solver.js");
const { solve } = global.window.PatchesSolver;

test("real 6x6 daily board solves and tiles validly", () => {
  const model = {
    rows: 6,
    cols: 6,
    seeds: [
      { r: 0, c: 0, type: "any", size: 2 },
      { r: 0, c: 3, type: "wide", size: null },
      { r: 1, c: 1, type: "any", size: 3 },
      { r: 1, c: 5, type: "tall", size: 6 },
      { r: 2, c: 2, type: "any", size: 2 },
      { r: 3, c: 3, type: "any", size: 3 },
      { r: 4, c: 0, type: "tall", size: 5 },
      { r: 4, c: 4, type: "any", size: 2 },
      { r: 5, c: 2, type: "tall", size: null },
      { r: 5, c: 5, type: "any", size: 3 },
    ],
  };
  const rects = solve(model);
  assert.ok(rects, "solvable");
  assertValidTiling(model, rects);
});

test("two free patches tile a 2x2", () => {
  const model = {
    rows: 2,
    cols: 2,
    seeds: [
      { r: 0, c: 0, type: "any", size: 2 },
      { r: 1, c: 0, type: "any", size: 2 },
    ],
  };
  const rects = solve(model);
  assert.ok(rects, "solvable");
  assertValidTiling(model, rects);
});

test("a single square fills the grid", () => {
  const model = { rows: 2, cols: 2, seeds: [{ r: 0, c: 0, type: "square", size: 4 }] };
  const rects = solve(model);
  assert.ok(rects, "solvable");
  assertValidTiling(model, rects);
  assert.equal(rects[0].bottom - rects[0].top, 1);
  assert.equal(rects[0].right - rects[0].left, 1);
});

test("orientation is enforced (tall vs wide)", () => {
  // 2 rows x 3 cols. A tall size-2 seed must be 2x1 (vertical); a wide size-2
  // seed must be 1x2 (horizontal). Together with a free seed they tile it.
  const model = {
    rows: 2,
    cols: 3,
    seeds: [
      { r: 0, c: 0, type: "tall", size: 2 }, // must take (0,0)+(1,0)
      { r: 0, c: 1, type: "wide", size: 2 }, // must take (0,1)+(0,2)
      { r: 1, c: 1, type: "wide", size: 2 }, // must take (1,1)+(1,2)
    ],
  };
  const rects = solve(model);
  assert.ok(rects, "solvable");
  assertValidTiling(model, rects);
});

test("returns null when a seed has no legal rectangle", () => {
  // tall + area 4 in a 2x2 is impossible (would need 4x1, which doesn't fit).
  const model = { rows: 2, cols: 2, seeds: [{ r: 0, c: 0, type: "tall", size: 4 }] };
  assert.equal(solve(model), null);
});

test("returns null when the grid cannot be fully tiled", () => {
  // One size-2 seed in a 3-cell row leaves a cell no seed can own.
  const model = { rows: 1, cols: 3, seeds: [{ r: 0, c: 0, type: "any", size: 2 }] };
  assert.equal(solve(model), null);
});
