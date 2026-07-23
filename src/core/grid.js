// Shared board reader for grid games (Zip, Patches, ...). Finds the grid element and turns its
// [data-cell-idx] cells into a common { rows, cols, cells, cellEls } shape; each game then extracts
// its own data (numbers/walls, seeds, ...) from cells. parseGrid returns null on an unreadable board.
(function () {
  "use strict";

  const { deepQuery } = window.GDom;

  function findBoard() {
    return deepQuery("[data-trail-grid]");
  }

  function columnCount(gridEl, cellCount) {
    const tpl = getComputedStyle(gridEl).gridTemplateColumns;
    if (tpl && tpl !== "none") {
      const cols = tpl.trim().split(/\s+/).length;
      if (cols > 1) return cols;
    }
    return Math.round(Math.sqrt(cellCount)); // fallback: assume square
  }

  function parseGrid(gridEl) {
    const cellNodes = [...gridEl.querySelectorAll("[data-cell-idx]")];
    if (cellNodes.length < 4) return null;

    const cols = columnCount(gridEl, cellNodes.length);
    const rows = Math.round(cellNodes.length / cols);
    if (rows * cols !== cellNodes.length) return null;

    const cellEls = new Map();
    const cells = [];
    for (const el of cellNodes) {
      const idx = parseInt(el.getAttribute("data-cell-idx"), 10);
      if (Number.isNaN(idx)) continue;
      cellEls.set(idx, el);
      cells.push({ idx, r: (idx / cols) | 0, c: idx % cols, el });
    }
    return { rows, cols, cells, cellEls };
  }

  window.GGrid = { findBoard, parseGrid };
})();
