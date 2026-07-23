"use strict";

// Shared helpers for path-game solver tests: walls, snake path, validator.
const assert = require("node:assert/strict");

global.window = global.window || {};
require("../../src/games/zip/solver.js");
const { edgeKey } = global.window.ZipSolver;

// Build a walls Set from a per-cell {idx: [sides]} spec, mirroring the parser.
function wallsFrom(spec, rows, cols) {
  const walls = new Set();
  for (const [i, sides] of Object.entries(spec)) {
    const k = +i;
    const r = (k / cols) | 0;
    const c = k % cols;
    for (const s of sides) {
      if (s === "right" && c + 1 < cols) walls.add(edgeKey(k, k + 1));
      if (s === "left" && c - 1 >= 0) walls.add(edgeKey(k, k - 1));
      if (s === "bottom" && r + 1 < rows) walls.add(edgeKey(k, k + cols));
      if (s === "top" && r - 1 >= 0) walls.add(edgeKey(k, k - cols));
    }
  }
  return walls;
}

// Row-major snake (boustrophedon) order: a Hamiltonian path that always exists.
function snake(rows, cols) {
  const order = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) row.push(r * cols + c);
    if (r % 2 === 1) row.reverse();
    order.push(...row);
  }
  return order;
}

// Assert that `path` is a legal ordered-checkpoint Hamiltonian path for `board`
// ({ rows, cols, numbers: Map<idx,value>, walls: Set<"a-b"> }).
function assertValidPath(board, path) {
  const { rows, cols, numbers, walls } = board;
  const n = rows * cols;
  assert.ok(Array.isArray(path), "returns a path");
  assert.equal(path.length, n, "covers every cell");
  assert.equal(new Set(path).size, n, "no cell repeats");

  for (let k = 1; k < path.length; k++) {
    const a = path[k - 1];
    const b = path[k];
    const dr = Math.abs(((a / cols) | 0) - ((b / cols) | 0));
    const dc = Math.abs((a % cols) - (b % cols));
    assert.equal(dr + dc, 1, `step ${k} is orthogonal`);
    assert.ok(!walls.has(edgeKey(a, b)), `step ${k} does not cross a wall`);
  }

  let maxVal = 0;
  for (const v of numbers.values()) if (v > maxVal) maxVal = v;

  let expect = 1;
  for (const idx of path) {
    if (numbers.has(idx)) {
      assert.equal(numbers.get(idx), expect, "numbers visited in order");
      expect++;
    }
  }
  assert.equal(expect - 1, maxVal, "all numbers 1..N used");
  assert.equal(numbers.get(path[0]), 1, "path starts on 1");
  assert.equal(numbers.get(path[n - 1]), maxVal, "path ends on N");
}

module.exports = { edgeKey, wallsFrom, snake, assertValidPath };
