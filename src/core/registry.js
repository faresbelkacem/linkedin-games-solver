// Games register here; the core uses this to detect and drive the active game.
(function () {
  "use strict";

  const games = [];

  function boardIfVisible(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? el : null;
  }

  window.Games = {
    register(game) {
      games.push(game);
    },
    // URL match only (for the popup).
    byUrl() {
      return games.find((g) => g.match(location.href)) || null;
    },
    // URL-matched game whose board is currently on screen.
    active() {
      for (const g of games) {
        if (!g.match(location.href)) continue;
        const board = boardIfVisible(g.findBoard());
        if (board) return { game: g, board };
      }
      return null;
    },
  };
})();
