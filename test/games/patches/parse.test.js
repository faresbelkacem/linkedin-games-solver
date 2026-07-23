"use strict";

// patches.js parse(), driven through the registered game with stubbed browser bits.
const test = require("node:test");
const assert = require("node:assert/strict");

global.window = global.window || {};
require("../../../src/games/patches/solver.js");

let game = null;
global.window.GGrid = { findBoard: () => null, parseGrid: (grid) => grid };
global.window.Games = { register: (g) => (game = g) };
require("../../../src/games/patches/patches.js");

function cell(label) {
  return {
    getAttribute: (n) => (n === "aria-label" ? label : null),
    querySelectorAll: () => [],
  };
}

function board(labels, cols) {
  const cells = labels.map((label, idx) => ({
    idx,
    r: (idx / cols) | 0,
    c: idx % cols,
    el: cell(label),
  }));
  return { rows: labels.length / cols, cols, cells, cellEls: new Map(cells.map((c) => [c.idx, c.el])) };
}

test("seed shapes and sizes come from French aria-labels", () => {
  const model = game.parse(
    board(
      [
        "Ligne 1, colonne 1, indice de forme libre, 2 cellules",
        "Ligne 1, colonne 2",
        "Ligne 2, colonne 1, indice rectangle horizontal",
        "Ligne 2, colonne 2, indice carré, 4 cellules",
      ],
      2
    )
  );
  assert.deepEqual(
    model.seeds.map((s) => ({ idx: s.idx, type: s.type, size: s.size })),
    [
      { idx: 0, type: "any", size: 2 },
      { idx: 2, type: "wide", size: null },
      { idx: 3, type: "square", size: 4 },
    ]
  );
});

test("English labels parse the same way", () => {
  const model = game.parse(
    board(["free shape hint, 3 cells", null, "tall rectangle hint", "square hint"], 2)
  );
  assert.deepEqual(
    model.seeds.map((s) => ({ type: s.type, size: s.size })),
    [
      { type: "any", size: 3 },
      { type: "tall", size: null },
      { type: "square", size: null },
    ]
  );
});

test("a board with fewer than two seeds is rejected", () => {
  assert.equal(game.parse(board(["indice carré", null, null, null], 2)), null);
});
