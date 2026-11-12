import {NextResponse as R} from "next/server";
export async function POST() { const r = R.json({ok: 1}); r.cookies.delete("s"); return r; }
