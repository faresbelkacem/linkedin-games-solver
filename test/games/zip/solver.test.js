"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { wallsFrom, snake, assertValidPath } = require("../../helpers/grid");

global.window = global.window || {};
require("../../../src/games/zip/solver.js");
const { solve } = global.window.ZipSolver;

test("real 7x7 daily board solves and is valid", () => {
  const rows = 7;
  const cols = 7;
  const numbers = new Map([
    [16, 6], [17, 7], [18, 3], [23, 5], [25, 2], [30, 8], [31, 4], [32, 1],
  ]);
  const spec = {
    1: ["bottom"], 2: ["bottom"], 5: ["bottom"], 7: ["right"], 8: ["left"],
    9: ["right"], 10: ["right", "left"], 11: ["bottom", "left"], 12: ["right"],
    13: ["left"], 14: ["right"], 15: ["left"], 19: ["bottom"], 21: ["right"],
    22: ["bottom", "left"], 26: ["right"], 27: ["left"], 30: ["bottom"],
    33: ["right"], 34: ["left"], 35: ["right"], 36: ["bottom", "left"],
    37: ["right"], 38: ["right", "left"], 39: ["bottom", "left"],
    40: ["right", "bottom"], 41: ["left"],
  };
  const board = { rows, cols, numbers, walls: wallsFrom(spec, rows, cols) };
  const path = solve(board);
  assert.ok(path, "solvable");
  assertValidPath(board, path);
});

test("3x3, no walls, endpoints only", () => {
  const board = { rows: 3, cols: 3, numbers: new Map([[0, 1], [8, 2]]), walls: new Set() };
  const path = solve(board);
  assert.ok(path, "solvable");
  assertValidPath(board, path);
});

test("3x3 with a middle checkpoint respects order", () => {
  const board = { rows: 3, cols: 3, numbers: new Map([[0, 1], [4, 2], [8, 3]]), walls: new Set() };
  const path = solve(board);
  assert.ok(path, "solvable");
  assertValidPath(board, path);
});

test("larger boards via snake reference (ordering + end at N)", () => {
  for (const [rows, cols] of [[4, 4], [5, 6], [6, 6]]) {
    const s = snake(rows, cols);
    const mid = s[Math.floor(s.length / 2)];
    const numbers = new Map([[s[0], 1], [mid, 2], [s[s.length - 1], 3]]);
    const board = { rows, cols, numbers, walls: new Set() };
    const path = solve(board);
    assert.ok(path, `${rows}x${cols} solvable`);
    assertValidPath(board, path);
  }
});

test("returns null when no path can end on N (parity)", () => {
  // On 3x3 the corners share one colour, so a Hamiltonian path over 9 cells
  // that starts on a corner must end on the same colour; ending on the adjacent
  // (other-colour) cell is impossible.
  const board = { rows: 3, cols: 3, numbers: new Map([[0, 1], [1, 2]]), walls: new Set() };
  assert.equal(solve(board), null);
});

test("returns null when the board is disconnected by walls", () => {
  // Wall the top row off from the rest: cell 2 can only reach 1, so no
  // full-coverage path exists.
  const rows = 3;
  const cols = 3;
  const spec = { 0: ["bottom"], 1: ["bottom"], 2: ["bottom", "left"] };
  const board = { rows, cols, numbers: new Map([[0, 1], [8, 2]]), walls: wallsFrom(spec, rows, cols) };
  assert.equal(solve(board), null);
});

test("respects the time budget without throwing", () => {
  const board = { rows: 3, cols: 3, numbers: new Map([[0, 1], [8, 2]]), walls: new Set() };
  const path = solve(board, { timeBudgetMs: 1000 });
  assert.ok(path);
  assertValidPath(board, path);
});
