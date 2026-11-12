import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Resend from "next-auth/providers/resend";
import PostgresAdapter from "@auth/pg-adapter";
import {Pool} from "@neondatabase/serverless";

// Only providers whose keys are set in the environment show up on the sign-in page.
const providers = [
  process.env.AUTH_GOOGLE_ID && Google,
  process.env.AUTH_GITHUB_ID && GitHub,
  process.env.AUTH_RESEND_KEY && Resend({from: process.env.EMAIL_FROM}),
].filter(Boolean) as any[];

export const {handlers,auth} = NextAuth(() => ({
  adapter: PostgresAdapter(new Pool({connectionString: process.env.DATABASE_URL}) as any),
  providers,
  callbacks: {session({session,user}) {(session.user as any).id = user.id; return session;}},
}));
export const uid = async () => Number(((await auth())?.user as any)?.id) || 0;
