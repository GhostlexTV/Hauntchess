import {cookies} from "next/headers";
import {createHmac} from "crypto";
// Signed session cookie. Uses AUTH_SECRET if set, otherwise falls back to DATABASE_URL so a missing secret can't break login.
const key = () => process.env.AUTH_SECRET || process.env.DATABASE_URL || "dev";
const sig = (v: string) => createHmac("sha256", key()).update(v).digest("base64url");
export const sessionCookie = (id: number) => `${id}.${sig(String(id))}`;
export const uid = async () => {
  const [id, s] = ((await cookies()).get("s")?.value || "").split(".");
  return s && s === sig(id) ? Number(id) || 0 : 0;
};
