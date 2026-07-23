"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

global.window = global.window || {};
require("../../../src/games/patches/solver.js");
const { dragPath } = global.window.PatchesSolver;

// A path is playable when it stays in the rectangle, moves one cell at a time, spans both diagonal corners (so the bbox is the full rectangle),
// and respects the game's rule: never start on the seed, end as close to it as possible.
function assertPlayable(rc, seed) {
  const path = dragPath(rc, seed);
  const start = path[0];
  const end = path[path.length - 1];

  const w = rc.right - rc.left + 1;
  const h = rc.bottom - rc.top + 1;
  assert.equal(path.length, w + h - 1, "visits one row and one column of cells");

  for (const p of path) {
    assert.ok(p.r >= rc.top && p.r <= rc.bottom && p.c >= rc.left && p.c <= rc.right, "stays inside the rectangle");
  }
  for (let i = 1; i < path.length; i++) {
    const dr = Math.abs(path[i].r - path[i - 1].r);
    const dc = Math.abs(path[i].c - path[i - 1].c);
    assert.equal(dr + dc, 1, "moves one cell at a time");
  }

  assert.ok(!(start.r === seed.r && start.c === seed.c), "never starts on the seed");
  assert.equal(start.r + end.r, rc.top + rc.bottom, "spans opposite corners (rows)");
  assert.equal(start.c + end.c, rc.left + rc.right, "spans opposite corners (cols)");
  return { start, end, path };
}

test("corner seed: drag ends exactly on the seed", () => {
  const rc = { top: 1, left: 2, bottom: 3, right: 4 };
  const { end } = assertPlayable(rc, { r: 3, c: 4 });
  assert.deepEqual(end, { r: 3, c: 4 });
});

test("single-row and single-column rectangles", () => {
  const row = assertPlayable({ top: 4, left: 2, bottom: 4, right: 4 }, { r: 4, c: 4 });
  assert.deepEqual(row.end, { r: 4, c: 4 });
  const col = assertPlayable({ top: 1, left: 0, bottom: 4, right: 0 }, { r: 1, c: 0 });
  assert.deepEqual(col.end, { r: 1, c: 0 });
});

test("interior seed: path passes through the seed", () => {
  const rc = { top: 2, left: 3, bottom: 4, right: 3 };
  const { path } = assertPlayable(rc, { r: 3, c: 3 });
  assert.ok(path.some((p) => p.r === 3 && p.c === 3));
});

test("every seed position in a 3x4 rectangle yields a playable path", () => {
  const rc = { top: 1, left: 1, bottom: 3, right: 4 };
  for (let r = rc.top; r <= rc.bottom; r++) {
    for (let c = rc.left; c <= rc.right; c++) {
      assertPlayable(rc, { r, c });
    }
  }
});

test("1x1 rectangle is just the seed cell", () => {
  const path = dragPath({ top: 2, left: 2, bottom: 2, right: 2 }, { r: 2, c: 2 });
  assert.deepEqual(path, [{ r: 2, c: 2 }]);
});
