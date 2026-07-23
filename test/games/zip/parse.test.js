"use strict";

// zip.js parse(), driven through the registered game with stubbed browser bits.
const test = require("node:test");
const assert = require("node:assert/strict");

global.window = global.window || {};
require("../../../src/games/zip/solver.js");

let game = null;
global.window.GDom = { center: () => ({ x: 0, y: 0 }) };
global.window.GGrid = { findBoard: () => null, parseGrid: (grid) => grid };
global.window.Games = { register: (g) => (game = g) };
global.getComputedStyle = (el, pseudo) => {
  if (pseudo) return { content: "none" };
  const b = el.borders || {};
  return {
    borderTopWidth: (b.top || 0) + "px",
    borderRightWidth: (b.right || 0) + "px",
    borderBottomWidth: (b.bottom || 0) + "px",
    borderLeftWidth: (b.left || 0) + "px",
  };
};
require("../../../src/games/zip/zip.js");

function cell(label, borders) {
  return {
    getAttribute: (n) => (n === "aria-label" ? label : null),
    textContent: "",
    querySelectorAll: () => [],
    borders,
  };
}

// 2x2 fixture in the shape GGrid.parseGrid returns.
function board(els) {
  const cells = els.map((el, idx) => ({ idx, r: (idx / 2) | 0, c: idx % 2, el }));
  return { rows: 2, cols: 2, cells, cellEls: new Map(cells.map((c) => [c.idx, c.el])) };
}

test("numbers come from aria-labels in any locale", () => {
  const model = game.parse(board([cell("Numéro 1"), cell(null), cell(null), cell("Number 2")]));
  assert.deepEqual([...model.numbers], [[0, 1], [3, 2]]);
  assert.equal(model.walls.size, 0);
});

test("thick borders become wall edges, deduplicated across neighbours", () => {
  const model = game.parse(
    board([
      cell("Numéro 1", { right: 8, bottom: 8 }),
      cell(null, { left: 8 }), // same edge as cell 0's right
      cell(null),
      cell("Numéro 2"),
    ])
  );
  assert.deepEqual([...model.walls].sort(), ["0-1", "0-2"]);
});

test("thin borders are not walls", () => {
  const model = game.parse(board([cell("Numéro 1", { right: 2 }), cell(null), cell(null), cell("Numéro 2")]));
  assert.equal(model.walls.size, 0);
});

test("a board without numbers is rejected", () => {
  assert.equal(game.parse(board([cell(null), cell(null), cell(null), cell(null)])), null);
});
