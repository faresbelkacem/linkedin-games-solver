// Patches pure logic (testable). solve() tiles the grid with one rectangle per
// seed, each with the seed's area (if numbered) and shape (square/wide/tall/any)
// and no other seed inside: enumerate legal rects per seed, then bitmask
// exact-cover. dragPath() routes the drag that draws a solved rectangle.
// solve(model, opts) -> rects[] | null;  model.seeds = [{ r, c, type, size|null }].
(function () {
  "use strict";

  function shapeOk(type, w, h) {
    if (type === "square") return w === h;
    if (type === "wide") return w > h;
    if (type === "tall") return h > w;
    return true; // "any"
  }

  function solve(model, opts) {
    const { rows, cols, seeds } = model;
    const n = rows * cols;
    const idxOf = (r, c) => r * cols + c;

    // Candidate rectangles for each seed.
    const cands = seeds.map((s) => {
      const list = [];
      for (let top = 0; top <= s.r; top++) {
        for (let bottom = s.r; bottom < rows; bottom++) {
          for (let left = 0; left <= s.c; left++) {
            for (let right = s.c; right < cols; right++) {
              const w = right - left + 1;
              const h = bottom - top + 1;
              const area = w * h;
              if (s.size != null && area !== s.size) continue;
              if (!shapeOk(s.type, w, h)) continue;
              // Must not swallow another seed.
              let bad = false;
              for (const o of seeds) {
                if (o === s) continue;
                if (o.r >= top && o.r <= bottom && o.c >= left && o.c <= right) {
                  bad = true;
                  break;
                }
              }
              if (bad) continue;
              let mask = 0n;
              for (let r = top; r <= bottom; r++) {
                for (let c = left; c <= right; c++) mask |= 1n << BigInt(idxOf(r, c));
              }
              list.push({ top, left, bottom, right, mask });
            }
          }
        }
      }
      return list;
    });

    if (cands.some((l) => l.length === 0)) return null;

    // Place the most-constrained seeds first.
    const order = seeds.map((_, i) => i).sort((a, b) => cands[a].length - cands[b].length);
    const full = (1n << BigInt(n)) - 1n;
    const chosen = new Array(seeds.length).fill(null);

    const deadline = Date.now() + ((opts && opts.timeBudgetMs) || 2000);
    let steps = 0;
    let result = null;

    function bt(k, used) {
      if ((++steps & 4095) === 0 && Date.now() > deadline) return true; // bail out
      if (k === order.length) {
        if (used === full) {
          result = chosen.slice();
          return true;
        }
        return false;
      }
      const si = order[k];
      for (const cand of cands[si]) {
        if ((used & cand.mask) !== 0n) continue;
        chosen[si] = cand;
        if (bt(k + 1, used | cand.mask)) return true;
        chosen[si] = null;
      }
      return false;
    }

    bt(0, 0n);
    if (!result) return null;

    return result.map(({ top, left, bottom, right }, i) => ({ seed: i, top, left, bottom, right }));
  }

  // The game commits a rectangle when the drag ends on its seed and refuses one
  // that starts there, so route from the corner farthest from the seed to the
  // corner nearest it (L-shaped, cell by cell).
  function dragPath(rc, seed) {
    const corners = [
      { r: rc.top, c: rc.left },
      { r: rc.top, c: rc.right },
      { r: rc.bottom, c: rc.left },
      { r: rc.bottom, c: rc.right },
    ];
    const dist = (p) => Math.abs(p.r - seed.r) + Math.abs(p.c - seed.c);
    const end = corners.reduce((a, b) => (dist(b) < dist(a) ? b : a));
    const start = { r: rc.top + rc.bottom - end.r, c: rc.left + rc.right - end.c };
    const path = [];
    const stepR = start.r <= end.r ? 1 : -1;
    const stepC = start.c <= end.c ? 1 : -1;
    for (let r = start.r; r !== end.r + stepR; r += stepR) path.push({ r, c: start.c });
    for (let c = start.c + stepC; c !== end.c + stepC; c += stepC) path.push({ r: end.r, c });
    return path;
  }

  window.PatchesSolver = { solve, dragPath };
})();
