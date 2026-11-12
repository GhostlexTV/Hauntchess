import {NextResponse as R} from "next/server";
import {sql} from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  return R.json(await sql`select coalesce(name,split_part(email,'@',1)) name,image,points from users order by points desc limit 5`);
}
