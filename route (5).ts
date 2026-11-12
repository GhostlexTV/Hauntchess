import {NextResponse as R} from "next/server";
import {uid} from "@/auth";
import {sql, push, START} from "@/lib/db";
export async function POST(q: Request) {
  const u = await uid(); if (!u) return R.json(null, {status: 401});
  const {ticket} = await q.json();
  await sql`delete from queue where user_id=${u} or created_at<now()-interval '2 minutes'`;
  const [o] = await sql`delete from queue where id=(select id from queue order by created_at limit 1 for update skip locked) returning *`;
  if (!o) { await sql`insert into queue(user_id,ticket) values(${u},${ticket})`; return R.json({wait: 1}); }
  const id = crypto.randomUUID(), f = Math.random() < 0.5;
  await sql`insert into games(id,white,black,fen,wms,bms,since) values(${id},${f ? u : o.user_id},${f ? o.user_id : u},${START},900000,900000,${Date.now()}::bigint)`;
  await push("t-" + o.ticket, "go", {id});
  return R.json({id});
}
export async function DELETE() { await sql`delete from queue where user_id=${await uid()}`; return R.json({ok: 1}); }
