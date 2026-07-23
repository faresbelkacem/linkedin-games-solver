// On-page toast + launcher button panel. The bootstrap decides when to show and what to do on click.
(function () {
  "use strict";

  const TOAST_ID = "lgs-toast";
  const FAB_ID = "lgs-fab";

  function toast(msg, kind) {
    let el = document.getElementById(TOAST_ID);
    if (!el) {
      el = document.createElement("div");
      el.id = TOAST_ID;
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.dataset.kind = kind || "info";
    el.classList.add("lgs-toast--show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("lgs-toast--show"), 3200);
  }

  const BUTTONS = [
    {
      mode: "autoplay",
      label: "Auto-play",
      cls: "lgs-fab-primary",
      icon:
        '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">' +
        '<path d="M8 5 L19 12 L8 19 Z"/></svg>',
    },
    {
      mode: "overlay",
      label: "Overlay",
      cls: "lgs-fab-ghost",
      icon:
        '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="3 3" ' +
        'aria-hidden="true"><path d="M3 18 L8 11 L14 15 L21 5"/></svg>',
    },
  ];

  function buildPanel(onClick) {
    const fab = document.createElement("div");
    fab.id = FAB_ID;
    for (const spec of BUTTONS) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "lgs-fab-btn " + spec.cls;
      b.innerHTML = spec.icon + '<span class="lgs-fab-label">' + spec.label + "</span>";
      b.addEventListener("click", () => onClick(spec.mode, b));
      fab.appendChild(b);
    }
    return fab;
  }

  function positionPanel(fab, board) {
    const r = board.getBoundingClientRect();
    const w = fab.offsetWidth || 128;
    const h = fab.offsetHeight || 80;
    if (r.right + 16 + w <= window.innerWidth - 8) {
      fab.style.left = r.right + 16 + "px";
      fab.style.top = Math.max(12, r.top) + "px";
    } else {
      fab.style.left = Math.max(8, r.left) + "px";
      fab.style.top = Math.max(12, r.top - h - 10) + "px";
    }
  }

  window.GUI = { toast, buildPanel, positionPanel, FAB_ID };
})();
