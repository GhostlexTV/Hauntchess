import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Resend from "next-auth/providers/resend";
import PostgresAdapter from "@auth/pg-adapter";
import {Pool} from "@neondatabase/serverless";

export const {handlers,auth} = NextAuth(() => ({
  adapter: PostgresAdapter(new Pool({connectionString: process.env.DATABASE_URL}) as any),
  providers: [Google, GitHub, Resend({from: process.env.EMAIL_FROM})],
  callbacks: {session({session,user}) {(session.user as any).id = user.id; return session;}},
}));
export const uid = async () => Number(((await auth())?.user as any)?.id) || 0;
