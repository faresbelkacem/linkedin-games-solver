// Zip solver (pure, testable): Hamiltonian path from cell 1 visiting the numbers in order. DFS + reachability
// prune + Warnsdorff, well under 1 ms on daily boards.
// solve(board, opts) -> number[] | null;  board = { rows, cols, numbers, walls }.
(function () {
  "use strict";

  function edgeKey(a, b) {
    return a < b ? a + "-" + b : b + "-" + a;
  }

  function buildAdjacency(rows, cols, walls) {
    const n = rows * cols;
    const adj = new Array(n);
    for (let i = 0; i < n; i++) {
      const r = (i / cols) | 0;
      const c = i % cols;
      const list = [];
      if (c + 1 < cols && !walls.has(edgeKey(i, i + 1))) list.push(i + 1);
      if (r + 1 < rows && !walls.has(edgeKey(i, i + cols))) list.push(i + cols);
      if (c - 1 >= 0 && !walls.has(edgeKey(i, i - 1))) list.push(i - 1);
      if (r - 1 >= 0 && !walls.has(edgeKey(i, i - cols))) list.push(i - cols);
      adj[i] = list;
    }
    return adj;
  }

  function solve(board, opts) {
    const timeBudgetMs = (opts && opts.timeBudgetMs) || 2500;
    const deadline = Date.now() + timeBudgetMs;
    let nodes = 0;

    const { rows, cols } = board;
    const n = rows * cols;
    const adj = buildAdjacency(rows, cols, board.walls || new Set());

    const valueAt = new Int32Array(n);
    let maxVal = 0;
    let startIdx = -1;
    for (const [idx, v] of board.numbers) {
      valueAt[idx] = v;
      if (v > maxVal) maxVal = v;
      if (v === 1) startIdx = idx;
    }
    if (startIdx < 0 || maxVal < 1) return null;

    const visited = new Uint8Array(n);
    const path = new Int32Array(n);

    const seen = new Uint8Array(n);
    const stack = new Int32Array(n);
    function allRemainingReachable(head, remaining) {
      seen.fill(0);
      let top = 0;
      stack[top++] = head;
      seen[head] = 1;
      let count = 0;
      while (top > 0) {
        const x = stack[--top];
        const nb = adj[x];
        for (let k = 0; k < nb.length; k++) {
          const y = nb[k];
          if (!visited[y] && !seen[y]) {
            seen[y] = 1;
            count++;
            stack[top++] = y;
          }
        }
      }
      return count >= remaining;
    }

    // Try most-constrained neighbours first (Warnsdorff) for speed.
    function orderedNeighbours(head) {
      const nb = adj[head];
      const cand = [];
      for (let k = 0; k < nb.length; k++) {
        const y = nb[k];
        if (visited[y]) continue;
        let deg = 0;
        const nn = adj[y];
        for (let m = 0; m < nn.length; m++) if (!visited[nn[m]]) deg++;
        cand.push([y, deg]);
      }
      cand.sort((a, b) => a[1] - b[1]);
      return cand;
    }

    let result = null;

    function dfs(head, count, nextVal) {
      if ((++nodes & 8191) === 0 && Date.now() > deadline) return true; // bail
      if (count === n) {
        // All cells used, numbers hit in order, last cell is K: valid path.
        result = Array.from(path.subarray(0, n));
        return true;
      }
      if (!allRemainingReachable(head, n - count)) return false;

      const cand = orderedNeighbours(head);
      for (let k = 0; k < cand.length; k++) {
        const next = cand[k][0];
        const v = valueAt[next];
        // A numbered cell may only be entered when it is the next in sequence.
        if (v !== 0 && v !== nextVal) continue;
        // The last number ends the path, so it may only be the final cell.
        if (maxVal >= 2 && v === maxVal && count + 1 !== n) continue;
        visited[next] = 1;
        path[count] = next;
        if (dfs(next, count + 1, v !== 0 ? nextVal + 1 : nextVal)) return true;
        visited[next] = 0;
      }
      return false;
    }

    visited[startIdx] = 1;
    path[0] = startIdx;
    dfs(startIdx, 1, 2);
    return result;
  }

  window.ZipSolver = { solve, edgeKey };
})();
