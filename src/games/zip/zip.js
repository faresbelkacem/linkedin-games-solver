// Zip module: parse the board, solve, apply (overlay/autoplay), register.
// DOM hooks (classes are hashed):
//    - grid div[data-trail-grid],
//    - cells div[data-cell-idx],
//    - number = digit in aria-label,
//    - wall = thick ::before/::after border.
(function () {
  "use strict";

  const WALL_MIN_PX = 6;
  const { center } = window.GDom;
  const { findBoard, parseGrid } = window.GGrid;
  const { solve, edgeKey } = window.ZipSolver;

  function numberFromCell(cell) {
    const label = cell.getAttribute("aria-label") || "";
    let m = label.match(/\d+/);
    if (m) return parseInt(m[0], 10);
    const t = (cell.textContent || "").trim();
    m = t.match(/^\d+$/);
    return m ? parseInt(m[0], 10) : null;
  }

  function wallSides(cell) {
    const sides = { top: false, right: false, bottom: false, left: false };
    for (const el of [cell, ...cell.querySelectorAll("*")]) {
      for (const pseudo of [null, "::before", "::after"]) {
        const s = getComputedStyle(el, pseudo || undefined);
        if (pseudo && s.content === "none") continue;
        if (parseFloat(s.borderTopWidth) >= WALL_MIN_PX) sides.top = true;
        if (parseFloat(s.borderRightWidth) >= WALL_MIN_PX) sides.right = true;
        if (parseFloat(s.borderBottomWidth) >= WALL_MIN_PX) sides.bottom = true;
        if (parseFloat(s.borderLeftWidth) >= WALL_MIN_PX) sides.left = true;
      }
      if (sides.top && sides.right && sides.bottom && sides.left) break;
    }
    return sides;
  }

  function parse(gridEl) {
    const grid = parseGrid(gridEl);
    if (!grid) return null;
    const { rows, cols, cells, cellEls } = grid;

    const numbers = new Map();
    const walls = new Set();

    for (const { idx, r, c, el } of cells) {
      const num = numberFromCell(el);
      if (num != null) numbers.set(idx, num);

      const w = wallSides(el);
      if (w.right && c + 1 < cols) walls.add(edgeKey(idx, idx + 1));
      if (w.left && c - 1 >= 0) walls.add(edgeKey(idx, idx - 1));
      if (w.bottom && r + 1 < rows) walls.add(edgeKey(idx, idx + cols));
      if (w.top && r - 1 >= 0) walls.add(edgeKey(idx, idx - cols));
    }

    if (!numbers.size) return null;
    return { rows, cols, numbers, walls, cellEls };
  }

  function apply(model, solution, ctx) {
    const toast = window.GUI.toast;

    if (ctx.mode === "autoplay") {
      const cells = solution.map((i) => model.cellEls.get(i));
      toast("Auto-playing solution...");
      return window.GAutoplay
        .dragThrough(cells, { durationMs: ctx.durationMs })
        .then(() => toast("Done. If the board didn't fill, use Overlay."));
    }

    const cellW = model.cellEls.get(solution[0]).getBoundingClientRect().width;
    window.GOverlay.drawPath(() => solution.map((i) => center(model.cellEls.get(i))), {
      strokeWidth: Math.max(6, cellW * 0.16),
      durationMs: ctx.durationMs,
    });
    toast("Solution drawn. Trace the line to fill the board.");
  }

  window.Games.register({
    id: "zip",
    label: "Zip",
    match: (url) => /\/games\/(?:view\/)?zip/.test(url),
    findBoard,
    parse,
    solve,
    apply,
    describe: (model) => ({ rows: model.rows, cols: model.cols, cells: model.rows * model.cols }),
  });
})();
