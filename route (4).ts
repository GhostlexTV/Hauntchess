import {NextResponse as R} from "next/server";
import {uid} from "@/auth";
import {sql} from "@/lib/db";
export async function GET() {
  const id = await uid(); if (!id) return R.json(null, {status: 401});
  const [u] = await sql`select id,coalesce(name,split_part(email,'@',1)) name,image,points,elo,(select count(*)+1 from users x where x.points>u.points)::int rank from users u where id=${id}`;
  return R.json(u);
}
export async function PATCH(q: Request) {
  const id = await uid(); if (!id) return R.json(null, {status: 401});
  const b = await q.json();
  if (typeof b.image === "string" && /^data:image\/(png|jpeg|gif);base64,/.test(b.image) && b.image.length < 3e5) await sql`update users set image=${b.image} where id=${id}`;
  if (typeof b.name === "string" && b.name.trim()) await sql`update users set name=${b.name.trim().slice(0, 24)} where id=${id}`;
  return R.json({ok: 1});
}
