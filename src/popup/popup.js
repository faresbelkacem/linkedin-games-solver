/* Popup: detect the active game on the page, then solve it in the chosen mode. */
(function () {
  "use strict";

  const modeButtons = [...document.querySelectorAll("#mode button")];
  const modeDesc = document.getElementById("modeDesc");
  const speed = document.getElementById("speed");
  const speedVal = document.getElementById("speedVal");
  const chip = document.getElementById("chip");
  const solveBtn = document.getElementById("solve");
  const status = document.getElementById("status");

  const MODE_DESC = {
    overlay: "Draws the answer as a line for you to trace.",
    autoplay: "Fills the board for you with simulated input.",
  };

  const state = { mode: "overlay", durationMs: 2000, ready: false };

  function render() {
    for (const b of modeButtons) {
      b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode));
    }
    modeDesc.textContent = MODE_DESC[state.mode];
    speed.value = String(state.durationMs);
    speed.style.setProperty("--pct", (state.durationMs / +speed.max) * 100 + "%");
    speedVal.textContent = state.durationMs === 0 ? "Instant" : (state.durationMs / 1000).toFixed(2) + " s";
    solveBtn.disabled = !state.ready;
  }

  function setStatus(text, isErr) {
    status.textContent = text;
    status.classList.toggle("err", !!isErr);
  }

  function setGame(label) {
    chip.textContent = label || "No game";
    chip.dataset.state = label ? "ready" : "none";
    state.ready = !!label;
    render();
  }

  chrome.storage.local.get(["mode", "durationMs"]).then((s) => {
    if (s.mode) state.mode = s.mode;
    if (typeof s.durationMs === "number") state.durationMs = s.durationMs;
    render();
  });

  for (const b of modeButtons) {
    b.addEventListener("click", () => {
      state.mode = b.dataset.mode;
      chrome.storage.local.set({ mode: state.mode });
      render();
    });
  }

  speed.addEventListener("input", () => {
    state.durationMs = parseInt(speed.value, 10);
    chrome.storage.local.set({ durationMs: state.durationMs });
    render();
  });

  async function activeTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  function send(tabId, msg) {
    return chrome.tabs
      .sendMessage(tabId, msg)
      .then((resp) => resp || { ok: false, error: "no-response" })
      .catch((e) => ({ ok: false, error: e.message }));
  }

  // On open, ask the page which game is active.
  (async function detect() {
    const tab = await activeTab();
    if (!tab || !/^https:\/\/www\.linkedin\.com\/games\//.test(tab.url || "")) {
      setGame(null);
      setStatus("Open a LinkedIn game to start.");
      return;
    }
    const resp = await send(tab.id, { cmd: "which" });
    if (resp.ok && resp.label) {
      setGame(resp.label);
      setStatus("Ready. Pick a mode and press Solve.");
    } else if (resp.ok) {
      setGame(null);
      setStatus("This game isn't supported yet.", true);
    } else {
      setGame(null);
      setStatus("Reload the game tab, then reopen this.", true);
    }
  })();

  solveBtn.addEventListener("click", async () => {
    if (!state.ready) return;
    const tab = await activeTab();
    setStatus("Solving...");
    const resp = await send(tab.id, { cmd: "solve", mode: state.mode, durationMs: state.durationMs });
    if (resp.ok) {
      const m = resp.meta;
      const size = m && m.rows ? ` ${m.rows}×${m.cols} (${m.cells} cells)` : "";
      setStatus(`Solved ${resp.label}${size} in ${resp.solveMs} ms.`);
    } else if (resp.error === "no-board") {
      setStatus("Board not ready. Reload the game and retry.", true);
    } else if (resp.error === "no-solution") {
      setStatus("Couldn't find a solution.", true);
    } else if (/Receiving end does not exist/.test(resp.error || "")) {
      setStatus("Reload the game tab, then try again.", true);
    } else {
      setStatus("Error: " + (resp.error || "unknown"), true);
    }
  });

  document.getElementById("clear").addEventListener("click", async () => {
    const tab = await activeTab();
    if (tab) await send(tab.id, { cmd: "clear" });
    setStatus("Overlay cleared.");
  });

  render();
})();
