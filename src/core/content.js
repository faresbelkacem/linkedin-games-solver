// Bootstrap (loads last). Drives the active game, owns the on-page buttons, answers the popup.
(function () {
  "use strict";

  const { toast, buildPanel, positionPanel, FAB_ID } = window.GUI;
  const DEFAULT_MS = 2000;

  const attempt = (fn) => {
    try {
      return fn();
    } catch (e) {
      return null;
    }
  };

  // Parse -> solve -> apply for whatever game is active.
  async function run(mode, durationMs) {
    const act = window.Games.active();
    if (!act) {
      toast("No supported game on this page.", "error");
      return { ok: false, error: "no-game" };
    }
    const { game, board } = act;

    const model = attempt(() => game.parse(board));
    if (!model) {
      toast("Could not read the " + game.label + " board.", "error");
      return { ok: false, error: "no-board" };
    }

    const t0 = performance.now();
    const solution = attempt(() => game.solve(model));
    const solveMs = Math.round((performance.now() - t0) * 10) / 10;
    if (!solution) {
      toast("No solution found for " + game.label + ".", "error");
      return { ok: false, error: "no-solution" };
    }

    try {
      await game.apply(model, solution, { mode, durationMs });
    } catch (e) {
      toast("Could not apply the solution.", "error");
      return { ok: false, error: "apply-failed" };
    }
    return {
      ok: true,
      label: game.label,
      solveMs,
      meta: game.describe ? game.describe(model, solution) : null,
    };
  }

  async function onPanelClick(mode, btn) {
    const fab = document.getElementById(FAB_ID);
    if (!fab) return;
    const buttons = [...fab.querySelectorAll(".lgs-fab-btn")];
    if (buttons.some((b) => b.hasAttribute("disabled"))) return;
    const label = btn.querySelector(".lgs-fab-label");
    const prev = label.textContent;
    label.textContent = "Solving...";
    buttons.forEach((b) => b.setAttribute("disabled", ""));
    try {
      const { durationMs } = await chrome.storage.local.get("durationMs");
      await run(mode, durationMs ?? DEFAULT_MS);
    } finally {
      label.textContent = prev;
      buttons.forEach((b) => b.removeAttribute("disabled"));
    }
  }

  function teardown() {
    const fab = document.getElementById(FAB_ID);
    if (fab) fab.remove();
    window.GOverlay.clear();
  }

  // The board found by the last ensurePanel tick; scroll/resize reuse it instead of re-walking the DOM.
  let board = null;

  function ensurePanel() {
    // Show only while a board is on screen (SPA nav keeps this script alive).
    const act = window.Games.active();
    board = act ? act.board : null;
    if (!board) {
      teardown();
      return;
    }
    let fab = document.getElementById(FAB_ID);
    if (!fab) {
      fab = buildPanel(onPanelClick);
      document.body.appendChild(fab);
    }
    positionPanel(fab, board);
  }

  let pending = false;
  function reposition() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      const fab = document.getElementById(FAB_ID);
      if (fab && board && board.isConnected) positionPanel(fab, board);
    });
  }

  ensurePanel();
  setInterval(ensurePanel, 800);
  window.addEventListener("scroll", reposition, true);
  window.addEventListener("resize", reposition);

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || !msg.cmd) return;
    if (msg.cmd === "which") {
      const game = window.Games.byUrl();
      sendResponse({ ok: true, label: game ? game.label : null });
      return;
    }
    if (msg.cmd === "solve") {
      run(msg.mode || "overlay", msg.durationMs ?? DEFAULT_MS).then(sendResponse);
      return true; // async response
    }
    if (msg.cmd === "clear") {
      window.GOverlay.clear();
      sendResponse({ ok: true });
    }
  });
})();
