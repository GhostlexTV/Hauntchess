import {Chess} from "chess.js";
const V: any = {p: 100, n: 320, b: 330, r: 500, q: 900, k: 0};
const ev = (c: Chess) => { let s = 0; for (const r of c.board()) for (const p of r) if (p) s += (p.color === "w" ? 1 : -1) * V[p.type]; return s; };
function ab(c: Chess, d: number, a: number, b: number): number {
  if (c.isCheckmate()) return c.turn() === "w" ? -1e5 - d : 1e5 + d;
  if (c.isDraw()) return 0;
  if (!d) return ev(c);
  const w = c.turn() === "w"; let best = w ? -1e9 : 1e9;
  for (const m of c.moves().sort((x, y) => +y.includes("x") - +x.includes("x"))) {
    c.move(m); const v = ab(c, d - 1, a, b); c.undo();
    if (w) { best = Math.max(best, v); a = Math.max(a, v); } else { best = Math.min(best, v); b = Math.min(b, v); }
    if (b <= a) break;
  }
  return best;
}
// Strength scales with the player's hidden Elo: lower Elo = shallower search + more random blunders.
export function pick(c: Chess, elo: number) {
  const ms = c.moves({verbose: true});
  if (Math.random() < Math.max(0, (1300 - elo) / 1300 * 0.7)) return ms[Math.random() * ms.length | 0];
  const d = elo < 1100 ? 1 : elo < 1500 ? 2 : 3, w = c.turn() === "w";
  let best: any = null, bv = w ? -1e9 : 1e9;
  ms.sort(() => Math.random() - 0.5);
  for (const m of ms) { c.move(m.san); const v = ab(c, d - 1, -1e9, 1e9); c.undo(); if (w ? v > bv : v < bv) { bv = v; best = m; } }
  return best;
}
