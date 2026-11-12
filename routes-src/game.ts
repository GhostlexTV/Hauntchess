import {NextResponse as R} from "next/server";
import {Chess} from "chess.js";
import {uid} from "@/auth";
import {sql, push, elo} from "@/lib/db";

const view = async (id: string) => (await sql`select g.*,coalesce(w.name,split_part(w.email,'@',1)) wn,coalesce(b.name,split_part(b.email,'@',1)) bn,w.points wp,b.points bp,w.elo we,b.elo be,w.image wi,b.image bi from games g join users w on w.id=g.white join users b on b.id=g.black where g.id=${id}`)[0];

async function end(g: any, w: string) { // w: 'w' | 'b' | 'd'
  const s = w === "d" ? 0.5 : w === "w" ? 1 : 0, dw = w === "w" ? 100 : w === "b" ? -50 : 0, db = w === "b" ? 100 : w === "w" ? -50 : 0;
  await sql`update games set status='over',winner=${w},pending=null where id=${g.id}`;
  await sql`update users set points=greatest(points+${dw}::int,0),elo=${elo(g.we, g.be, s)}::int where id=${g.white}`;
  await sql`update users set points=greatest(points+${db}::int,0),elo=${elo(g.be, g.we, 1 - s)}::int where id=${g.black}`;
}

export async function GET(q: Request) {
  const id = new URL(q.url).searchParams.get("id")!, u = await uid(), g = await view(id);
  if (!g || (u !== g.white && u !== g.black)) return R.json(null, {status: 403});
  const {we, be, ...p} = g; return R.json(p);
}

export async function POST(q: Request) {
  const id = new URL(q.url).searchParams.get("id")!, u = await uid(), {a, m} = await q.json();
  let g = await view(id);
  if (!g || (u !== g.white && u !== g.black)) return R.json(null, {status: 403});
  const c = u === g.white ? "w" : "b", now = Date.now(), turn = g.fen.split(" ")[1];
  const rem = (k: string) => (k === "w" ? g.wms : g.bms) - (turn === k && g.status === "play" ? now - Number(g.since) : 0);
  const pend = () => sql`update games set status='pending',pending=${turn} where id=${id}`;
  if (g.status === "play") {
    if (a === "resign") await end(g, c === "w" ? "b" : "w");
    else if (a === "timeout" && rem(turn) <= 0) await pend();
    else if (a === "move" && turn === c) {
      if (rem(c) <= 0) await pend();
      else {
        const ch = new Chess(g.fen); let mv: any;
        try { mv = ch.move(m); } catch { return R.json(null, {status: 400}); }
        await sql`update games set fen=${ch.fen()},wms=${c === "w" ? rem(c) : g.wms}::int,bms=${c === "b" ? rem(c) : g.bms}::int,since=${now}::bigint where id=${id}`;
        if (mv.captured) await sql`update users set points=points+${mv.captured === "p" ? 5 : 10}::int where id=${u}`;
        if (ch.isCheckmate()) await end(g, c); else if (ch.isDraw()) await end(g, "d");
      }
    }
  } else if (g.status === "pending" && a === "vote" && c !== g.pending) {
    if (m === "y") await sql`update games set status='play',pending=null,wms=${g.pending === "w" ? 3e5 : g.wms}::int,bms=${g.pending === "b" ? 3e5 : g.bms}::int,since=${now}::bigint where id=${id}`;
    else await end(g, c);
  }
  g = await view(id);
  const {we, be, wi, bi, ...p} = g;
  await push("g-" + id, "u", p);
  return R.json(p);
}
