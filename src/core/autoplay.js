// Drag playback for LinkedIn's trail-style boards.
// The game listens to mouse events only (mousedown on a cell, document-level mousemove resolved through elementFromPoint, mouseup to commit),
// so that's all we send. opts.durationMs spreads the drag over the whole gesture.
(function () {
  "use strict";

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const { center } = window.GDom;
  const MIN_STEP_MS = 60; // faster than this and the game skips cells

  function fire(el, type, x, y, buttons) {
    el.dispatchEvent(
      new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        clientX: x,
        clientY: y,
        button: 0,
        buttons: buttons,
      })
    );
  }

  async function dragThrough(cells, opts = {}) {
    if (!cells.length) return;
    const budget = opts.durationMs > 0 ? opts.durationMs / Math.max(1, cells.length - 1) : 0;
    const stepMs = Math.max(MIN_STEP_MS, budget);

    const first = cells[0];
    let p = center(first);
    fire(first, "mousedown", p.x, p.y, 1);
    await sleep(stepMs);

    for (let k = 1; k < cells.length; k++) {
      p = center(cells[k]);
      const target = document.elementFromPoint(p.x, p.y) || cells[k];
      fire(target, "mousemove", p.x, p.y, 1);
      fire(document, "mousemove", p.x, p.y, 1);
      await sleep(stepMs);
    }

    fire(cells[cells.length - 1], "mouseup", p.x, p.y, 0);
  }

  window.GAutoplay = { dragThrough, sleep };
})();
