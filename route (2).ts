import {NextResponse as R} from "next/server";
import {resolveMx, resolve4} from "dns/promises";
import {randomBytes, scryptSync, timingSafeEqual} from "crypto";
import {sql} from "@/lib/db";
import {sessionCookie} from "@/auth";

const hash = (p: string) => { const s = randomBytes(16).toString("hex"); return s + ":" + scryptSync(p, s, 64).toString("hex"); };
const same = (p: string, h: string) => { try { const [s, x] = h.split(":"); return timingSafeEqual(Buffer.from(x, "hex"), scryptSync(p, s, 64)); } catch { return false; } };
const err = (error: string) => R.json({error}, {status: 400});

export async function POST(q: Request) {
  const {email = "", password = "", mode} = await q.json();
  const e = String(email).trim().toLowerCase(), pw = String(password);
  if (e.length > 254 || !/^[^\s@]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(e)) return err("Enter a valid email address.");
  if (pw.length < 8 || pw.length > 200) return err("Password must be at least 8 characters.");
  const [u] = await sql`select id,pw from users where email=${e}`;
  let id: number;
  if (mode === "signup") {
    if (u) return err("That email already has an account. Sign in instead.");
    const d = e.split("@")[1];
    const mx = await resolveMx(d).catch(() => []);
    if (!mx.length && !(await resolve4(d).catch(() => [])).length) return err("That email domain can't receive mail. Check for typos.");
    const [n] = await sql`insert into users(email,pw) values(${e},${hash(pw)}) returning id`;
    id = n.id;
  } else {
    if (!u?.pw || !same(pw, u.pw)) return err("Wrong email or password.");
    id = u.id;
  }
  const r = R.json({ok: 1});
  r.cookies.set("s", sessionCookie(id), {httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30});
  return r;
}
