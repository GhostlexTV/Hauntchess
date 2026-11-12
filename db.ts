import {neon} from "@neondatabase/serverless";
import Pusher from "pusher";
export const sql: any = (s: any, ...v: any[]) => neon(process.env.DATABASE_URL!)(s, ...v);
export const push = (c: string, e: string, d: any) => new Pusher({appId: process.env.PUSHER_APP_ID!, key: process.env.NEXT_PUBLIC_PUSHER_KEY!, secret: process.env.PUSHER_SECRET!, cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!, useTLS: true}).trigger(c, e, d);
export const elo = (a: number, b: number, s: number) => Math.round(a + 32 * (s - 1 / (1 + 10 ** ((b - a) / 400))));
export const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
