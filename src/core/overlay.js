// Shared SVG overlay (one #lgs-overlay element, cleared by the core's teardown).
// drawPath animates a polyline growing through points; drawRegions reveals filled rectangles one by one.
// The getX callbacks run every frame so the drawing tracks the board through scroll and resize.
(function () {
  "use strict";

  const ID = "lgs-overlay";
  const NS = "http://www.w3.org/2000/svg";
  let raf = null;

  function ensureSvg() {
    let svg = document.getElementById(ID);
    if (svg) return svg;
    svg = document.createElementNS(NS, "svg");
    svg.id = ID;
    Object.assign(svg.style, {
      position: "fixed",
      left: "0",
      top: "0",
      width: "100vw",
      height: "100vh",
      pointerEvents: "none",
      zIndex: "2147483646",
    });
    document.body.appendChild(svg);
    return svg;
  }

  // Runs render(progress) every frame until the overlay is removed.
  function animate(durationMs, render) {
    const dur = Math.max(0, durationMs || 0);
    const start = performance.now();
    cancelAnimationFrame(raf);
    const frame = (now) => {
      if (!document.getElementById(ID)) return;
      render(dur <= 0 ? 1 : Math.min(1, (now - start) / dur));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }

  function rgba(color, alpha) {
    const m = String(color).match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    return m ? `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})` : color;
  }

  function drawPath(getPoints, opts = {}) {
    const svg = ensureSvg();
    const mk = (stroke) => {
      const p = document.createElementNS(NS, "polyline");
      p.setAttribute("fill", "none");
      p.setAttribute("stroke", stroke);
      p.setAttribute("stroke-linecap", "round");
      p.setAttribute("stroke-linejoin", "round");
      return p;
    };
    const casing = mk("#0e2a47");
    casing.setAttribute("opacity", "0.9");
    const core = mk("#ffffff");
    const head = document.createElementNS(NS, "circle");
    head.setAttribute("fill", "#ffffff");
    head.setAttribute("stroke", "#0e2a47");
    head.setAttribute("stroke-width", "3");
    svg.replaceChildren(casing, core, head);

    const strokeW = Math.max(6, opts.strokeWidth || 10);
    core.setAttribute("stroke-width", String(strokeW));
    casing.setAttribute("stroke-width", String(strokeW + 5));
    head.setAttribute("r", String(strokeW * 0.72));

    animate(opts.durationMs, (prog) => {
      const pts = getPoints();
      if (!pts || pts.length === 0) return;

      let parts = pts;
      let tip = pts[pts.length - 1];
      if (prog < 1) {
        const seg = [0];
        let total = 0;
        for (let i = 1; i < pts.length; i++) {
          total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
          seg.push(total);
        }
        const drawn = prog * total;
        parts = [pts[0]];
        tip = pts[0];
        for (let i = 1; i < pts.length; i++) {
          if (seg[i] <= drawn) {
            parts.push(pts[i]);
            tip = pts[i];
          } else {
            const len = seg[i] - seg[i - 1];
            const f = len > 0 ? (drawn - seg[i - 1]) / len : 0;
            tip = {
              x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f,
              y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f,
            };
            parts.push(tip);
            break;
          }
        }
      }
      const s = parts.map((p) => p.x + "," + p.y).join(" ");
      casing.setAttribute("points", s);
      core.setAttribute("points", s);
      head.setAttribute("cx", String(tip.x));
      head.setAttribute("cy", String(tip.y));
      head.style.display = prog < 1 ? "" : "none";
    });
  }

  // getRegions() -> [{ x, y, w, h, color }]; count and colors stay constant,
  // so the rects are created once and only their geometry moves per frame.
  function drawRegions(getRegions, opts = {}) {
    const svg = ensureSvg();
    let rects = null;

    animate(opts.durationMs, (prog) => {
      const regs = getRegions();
      if (!regs || regs.length === 0) return;

      if (!rects) {
        rects = regs.map((g) => {
          const rect = document.createElementNS(NS, "rect");
          rect.setAttribute("rx", "5");
          rect.setAttribute("fill", rgba(g.color, 0.3));
          rect.setAttribute("stroke", g.color);
          rect.setAttribute("stroke-width", "3");
          return rect;
        });
        svg.replaceChildren(...rects);
      }

      const show = Math.max(1, Math.ceil(prog * regs.length));
      for (let i = 0; i < regs.length; i++) {
        const g = regs[i];
        const rect = rects[i];
        rect.setAttribute("x", String(g.x));
        rect.setAttribute("y", String(g.y));
        rect.setAttribute("width", String(g.w));
        rect.setAttribute("height", String(g.h));
        rect.style.display = i < show ? "" : "none";
      }
    });
  }

  function clear() {
    cancelAnimationFrame(raf);
    const svg = document.getElementById(ID);
    if (svg) svg.remove();
  }

  window.GOverlay = { drawPath, drawRegions, clear };
})();
