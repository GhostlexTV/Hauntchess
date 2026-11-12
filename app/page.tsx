"use client";
import {useEffect, useRef, useState} from "react";
import {Chess} from "chess.js";
import Pusher from "pusher-js";
import {pick} from "@/lib/ai";

const G: any = {k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟\uFE0E"};
const F = "abcdefgh";
const fmt = (ms: number) => { const s = Math.ceil(Math.max(0, ms) / 1000); return `${s / 60 | 0}:${String(s % 60).padStart(2, "0")}`; };
const j = (u: string, method = "GET", body?: any) => fetch(u, {method, headers: {"content-type": "application/json"}, body: body && JSON.stringify(body)}).then(r => r.status === 401 ? null : r.json()).catch(() => null);
const QUOTE = "Every move brings you closer to victory.";

export default function App() {
  const [me, setMe] = useState<any>(undefined);
  const [lb, setLb] = useState<any[]>([]);
  const [mode, setMode] = useState(""); // "" | bot | local | queue | online
  const ch = useRef(new Chess());
  const [fen, setFen] = useState(ch.current.fen());
  const [sel, setSel] = useState("");
  const [clk, setClk] = useState({w: 9e5, b: 9e5, t: Date.now()});
  const [now, setNow] = useState(Date.now());
  const [og, setOg] = useState<any>(null);
  const [res, setRes] = useState("");
  const [msg, setMsg] = useState(QUOTE);
  const [cfg, setCfg] = useState(false);
  const px = useRef<any>(null), sent = useRef(0);

  const load = async () => { setMe(await j("/api/me")); setLb((await j("/api/lb")) || []); };
  useEffect(() => { load(); const i = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(i); }, []);

  const turn = fen.split(" ")[1];
  const mc = mode === "online" && og ? (og.white === me?.id ? "w" : "b") : "w";
  const running = !!mode && mode !== "queue" && !res && (mode !== "online" || og?.status === "play");
  const rem = (c: string) => clk[c as "w" | "b"] - (running && turn === c ? now - clk.t : 0);

  const clean = () => px.current?.allChannels().forEach((c: any) => px.current.unsubscribe(c.name));
  const begin = (m: string) => { clean(); ch.current = new Chess(); setFen(ch.current.fen()); setClk({w: 9e5, b: 9e5, t: Date.now()}); setRes(""); setSel(""); setOg(null); setMsg(QUOTE); setMode(m); };
  const reset = () => { if (mode === "queue") j("/api/queue", "DELETE"); begin(""); };

  const fin = async (t: string, r: string) => {
    setRes(t);
    if (mode === "bot") {
      const cap = ch.current.history({verbose: true}).filter((m: any) => m.color === "w" && m.captured).reduce((s: number, m: any) => s + (m.captured === "p" ? 5 : 10), 0);
      await j("/api/bot", "POST", {r, cap}); load();
    }
  };
  const after = (mv: any) => {
    const c = ch.current, w = mv.color;
    setFen(c.fen()); setSel("");
    setClk(k => ({...k, [w]: k[w as "w" | "b"] - (Date.now() - k.t), t: Date.now()}));
    if (c.isCheckmate()) fin(mode === "bot" ? (w === "w" ? "Checkmate — you win!" : "Checkmate — RivalBot wins") : (w === "w" ? "White" : "Black") + " wins by checkmate", w === "w" ? "w" : "l");
    else if (c.isDraw()) fin("Draw", "d");
  };
  const botMove = () => {
    const c = ch.current; if (c.isGameOver() || c.turn() !== "b") return;
    const m = pick(c, me.elo); after(c.move({from: m.from, to: m.to, promotion: m.promotion}));
  };

  const sync = (r: any) => {
    if (!r?.fen) return;
    ch.current.load(r.fen); setFen(r.fen); setSel(""); setOg((o: any) => ({...o, ...r})); setClk({w: r.wms, b: r.bms, t: Date.now()});
    if (r.status === "over") { const my = r.white === me.id ? "w" : "b"; setRes(r.winner === "d" ? "Draw" : r.winner === my ? "You win!" : "You lose"); load(); }
  };
  const start = async (id: string) => {
    const r = await j("/api/game?id=" + id); setMode("online");
    px.current.subscribe("g-" + id).bind("u", (d: any) => sync(d)); sync(r);
  };
  const find = async () => {
    begin("queue"); const t = crypto.randomUUID();
    px.current ??= new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!});
    px.current.subscribe("t-" + t).bind("go", (d: any) => start(d.id));
    const r = await j("/api/queue", "POST", {ticket: t}); if (r?.id) start(r.id);
  };

  // Time's up: bots always grant +5:00; local players vote; online opponent votes via the server.
  useEffect(() => {
    if (!running || rem(turn) > 0) return;
    const add = () => setClk(k => ({...k, [turn]: 3e5, t: Date.now()}));
    if (mode === "bot") { setMsg("Time's up — RivalBot granted +5:00"); add(); }
    else if (mode === "local") { if (confirm(`Time's up for ${turn === "w" ? "White" : "Black"}. Grant 5 more minutes?`)) add(); else fin((turn === "w" ? "Black" : "White") + " wins on time", "l"); }
    else if (mode === "online" && Date.now() - sent.current > 2000) { sent.current = Date.now(); j("/api/game?id=" + og.id, "POST", {a: "timeout"}).then(sync); }
  });

  const click = async (sq: string) => {
    const c = ch.current;
    if (!running || (mode === "online" && turn !== mc) || (mode === "bot" && turn !== "w")) return;
    const t = sel && c.moves({square: sel as any, verbose: true}).find((m: any) => m.to === sq);
    if (t) {
      if (mode === "online") { const from = sel; setSel(""); sync(await j("/api/game?id=" + og.id, "POST", {a: "move", m: {from, to: sq, promotion: "q"}})); return; }
      after(c.move({from: sel, to: sq, promotion: "q"})); if (mode === "bot") setTimeout(botMove, 350); return;
    }
    const p = c.get(sq as any); setSel(p && p.color === turn ? sq : "");
  };
  const undo = () => { const c = ch.current; if (res || !(mode === "bot" || mode === "local")) return; c.undo(); if (mode === "bot" && c.turn() !== "w") c.undo(); setFen(c.fen()); setSel(""); };
  const resign = () => { if (!running) return; if (mode === "online") j("/api/game?id=" + og.id, "POST", {a: "resign"}).then(sync); else if (mode === "bot") fin("You resigned", "l"); else fin((turn === "w" ? "Black" : "White") + " wins by resignation", "l"); };
  const vote = (m: string) => j("/api/game?id=" + og.id, "POST", {a: "vote", m}).then(sync);
  const upload = (e: any) => { const f = e.target.files[0]; if (!f) return; if (f.size > 2e5) return alert("Max file size is 200 KB."); const r = new FileReader(); r.onload = async () => { await j("/api/me", "PATCH", {image: r.result}); load(); }; r.readAsDataURL(f); };
  const rename = async () => { await j("/api/me", "PATCH", {name: (document.getElementById("nm") as any).value}); load(); setCfg(false); };

  if (me === undefined) return <div className="c">Loading…</div>;
  if (!me) return <div className="c"><div style={{fontSize: 64}} className="logo">♞</div><h1>Chess</h1><p>Think • Move • Win</p><a className="gold" href="/api/auth/signin">Sign in to play</a></div>;

  const P = (c: string): any => {
    if (mode === "online" && og) return {n: c === "w" ? og.wn : og.bn, i: c === "w" ? og.wi : og.bi, p: c === "w" ? og.wp : og.bp};
    if (mode === "bot") return c === "w" ? {n: me.name, i: me.image, p: me.points} : {n: "RivalBot", bot: 1};
    return {n: c === "w" ? "White" : "Black"};
  };
  const Card = (c: string) => { const p = P(c); return (
    <div className={"card" + (running && turn === c ? " on" : "")}>
      <div className="av">{p.i ? <img src={p.i} alt="" /> : p.bot ? "🤖" : "♞"}</div>
      <b>{p.n}</b>{c === mc && mode !== "local" && <small>(You)</small>}
      <div className="st">{p.bot ? "Adapts to you" : p.p !== undefined ? "★ " + p.p : ""}</div>
      <div className="clk">⏱ {fmt(rem(c))}</div>
    </div>); };

  const flip = mc === "b", pend = og?.status === "pending";
  const hints = new Set(sel ? ch.current.moves({square: sel as any, verbose: true}).map((m: any) => m.to) : []);
  const sqs: string[] = [];
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) sqs.push(F[flip ? 7 - f : f] + (flip ? r + 1 : 8 - r));

  return (<>
    <div className="app">
      <nav>
        <div className="logo">♞<h2>Chess</h2><small>Think • Move • Win</small></div>
        <button className="on" onClick={reset}>⌂ Home</button>
        <button onClick={() => setCfg(true)}>⚙ Settings</button>
        <a href="/api/auth/signout">⏻ Sign out</a>
        <p>Rank #{me.rank} · ★ {me.points}<br />Play Chess.<br />Sharpen Your Mind.</p>
      </nav>

      {Card(mc)}
      <div>
        <div className="bd">
          {sqs.map(sq => { const p = ch.current.get(sq as any), d = (F.indexOf(sq[0]) + +sq[1]) % 2 === 1; return (
            <div key={sq} onClick={() => click(sq)} className={`s ${d ? "d" : "l"}${sel === sq ? " sel" : ""}${hints.has(sq) ? " hint" : ""}`}>
              {p && <span className={p.color === "w" ? "pw" : "pb"}>{G[p.type]}</span>}
            </div>); })}
          {(!mode || mode === "queue" || res) && <div className="ov">
            {res ? <><b>{res}</b><button className="gold" onClick={reset}>New game</button></>
              : mode === "queue" ? <><span>Searching for an opponent…</span><button className="ghost" onClick={reset}>Cancel</button></>
              : <><button className="gold" onClick={() => begin("bot")}>Play RivalBot</button><button className="ghost" onClick={() => begin("local")}>Local 2-player</button><button className="ghost" onClick={find}>Find opponent online</button></>}
          </div>}
        </div>
        <div className="bar">♞ {pend ? (og.pending !== mc
          ? <span>Opponent is out of time. <button className="gold" onClick={() => vote("y")}>Grant +5:00</button> <button className="ghost" onClick={() => vote("n")}>Decline</button></span>
          : <span>You're out of time. Waiting for your opponent to vote…</span>) : msg}</div>
      </div>
      {Card(flip ? "w" : "b")}

      <div className="side">
        <div className="box"><h4>⚡ Game controls</h4>
          <button className="ghost" onClick={undo}>↶ Undo</button>
          <button className="ghost" onClick={resign}>⚑ Resign</button>
          <button className="ghost" onClick={() => setCfg(true)}>⚙ Settings</button></div>
        <div className="box"><h4>🏆 Leaderboard</h4>
          {lb.map((u, i) => <div className="lb" key={i}>{i + 1}{u.image ? <img src={u.image} alt="" /> : <i />}{u.name}<b>★ {u.points}</b></div>)}</div>
        <button className="gold" onClick={find} disabled={mode === "queue" || (running && mode === "online")}>Find opponent</button>
      </div>
    </div>
    {cfg && <div className="mod"><div><h3 style={{margin: 0}}>Settings</h3>
      <label>Display name<input id="nm" defaultValue={me.name} maxLength={24} /></label>
      <label>Profile picture (PNG, JPG or GIF)<input type="file" accept="image/png,image/jpeg,image/gif" onChange={upload} /></label>
      <button className="gold" onClick={rename}>Save</button><button className="ghost" onClick={() => setCfg(false)}>Close</button></div></div>}
  </>);
}
