import {NextResponse as R} from "next/server";
import {uid} from "@/auth";
import {sql, elo} from "@/lib/db";
// Reports a finished game vs the bot. r: w (win) | l (loss) | d (draw); cap: capture points earned.
export async function POST(q: Request) {
  const id = await uid(); if (!id) return R.json(null, {status: 401});
  const {r, cap} = await q.json();
  const [m] = await sql`select elo from users where id=${id}`;
  const dp = (r === "w" ? 100 : r === "l" ? -50 : 0) + Math.min(Math.max(+cap || 0, 0), 110);
  await sql`update users set points=greatest(points+${dp}::int,0),elo=${elo(m.elo, m.elo, r === "w" ? 1 : r === "l" ? 0 : 0.5)}::int where id=${id}`;
  return R.json({ok: 1});
}
