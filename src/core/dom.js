// Shadow-piercing querySelector + cell centre, shared by game modules.
(function () {
  "use strict";

  function deepQuery(selector) {
    const roots = [document];
    for (let i = 0; i < roots.length; i++) {
      const hit = roots[i].querySelector(selector);
      if (hit) return hit;
      for (const el of roots[i].querySelectorAll("*")) {
        if (el.shadowRoot) roots.push(el.shadowRoot);
      }
    }
    return null;
  }

  function center(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  window.GDom = { deepQuery, center };
})();
