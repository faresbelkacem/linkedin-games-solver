// Patches module: parse the board, solve, apply (overlay/autoplay), register.
// Same grid/cell hooks as Zip;
// each seed's shape + size comes from its aria-label (e.g. "indice de forme libre, 2 cellules" = free shape, area 2).
(function () {
  "use strict";

  const { findBoard, parseGrid } = window.GGrid;
  const { solve, dragPath } = window.PatchesSolver;

  // Read a seed's shape type + size from its aria-label (French + English).
  function seedSpec(al) {
    const s = (al || "").toLowerCase();
    let type = null;
    if (/carr|square/.test(s)) type = "square";
    else if (/horizontal|large|wide/.test(s)) type = "wide";
    else if (/vertical|haut|tall/.test(s)) type = "tall";
    else if (/libre|free|any/.test(s)) type = "any";
    if (!type) return null; // not a seed cell
    const m = s.match(/(\d+)\s*(cellule|cell)/);
    return { type, size: m ? +m[1] : null };
  }

  // The seed's colour is the largest coloured element inside the cell.
  function seedColor(cell) {
    let best = null;
    let bestArea = 0;
    for (const el of cell.querySelectorAll("*")) {
      const bg = getComputedStyle(el).backgroundColor;
      if (!bg || /transparent|(?:^|[^\d])0,\s*0,\s*0,\s*0\)/.test(bg)) continue;
      const r = el.getBoundingClientRect();
      const area = r.width * r.height;
      if (area > bestArea) {
        bestArea = area;
        best = bg;
      }
    }
    return best || "rgb(30, 91, 230)";
  }

  function parse(gridEl) {
    const grid = parseGrid(gridEl);
    if (!grid) return null;
    const { rows, cols, cells, cellEls } = grid;

    const seeds = [];
    for (const { idx, r, c, el } of cells) {
      const spec = seedSpec(el.getAttribute("aria-label"));
      if (spec) {
        seeds.push({ idx, r, c, type: spec.type, size: spec.size, color: seedColor(el) });
      }
    }
    if (seeds.length < 2) return null;
    return { rows, cols, seeds, cellEls };
  }

  function cellAt(model, r, c) {
    return model.cellEls.get(r * model.cols + c);
  }

  async function autoplay(model, rects, ctx) {
    const { dragThrough, sleep } = window.GAutoplay;
    const paths = rects.map((rc) => dragPath(rc, model.seeds[rc.seed]));
    const totalCells = paths.reduce((s, p) => s + p.length, 0);
    for (const path of paths) {
      const cells = path.map((p) => cellAt(model, p.r, p.c));
      const budget = (ctx.durationMs * path.length) / totalCells;
      await dragThrough(cells, { durationMs: budget });
      await sleep(150);
    }
  }

  function apply(model, rects, ctx) {
    const toast = window.GUI.toast;

    if (ctx.mode === "autoplay") {
      toast("Auto-playing patches...");
      return autoplay(model, rects, ctx).then(() =>
        toast("Done. If a patch didn't fill, use Overlay for it.")
      );
    }

    const regions = () =>
      rects.map((rc) => {
        const tl = cellAt(model, rc.top, rc.left).getBoundingClientRect();
        const br = cellAt(model, rc.bottom, rc.right).getBoundingClientRect();
        const pad = 2;
        return {
          x: tl.left + pad,
          y: tl.top + pad,
          w: br.right - tl.left - 2 * pad,
          h: br.bottom - tl.top - 2 * pad,
          color: model.seeds[rc.seed].color,
        };
      });

    window.GOverlay.drawRegions(regions, { durationMs: ctx.durationMs });
    toast("Patches drawn. Recreate each rectangle on the board.");
  }

  window.Games.register({
    id: "patches",
    label: "Patches",
    match: (url) => /\/games\/(?:view\/)?patches/.test(url),
    findBoard,
    parse,
    solve,
    apply,
    describe: (model) => ({ rows: model.rows, cols: model.cols, cells: model.rows * model.cols }),
  });
})();
