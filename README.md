# Chess — Vercel + Neon + Pusher

1. **Neon**: create a project, open the SQL editor, run `schema.sql`. Copy the connection string to `DATABASE_URL`.
2. **Pusher Channels**: create an app, copy app id, key, secret, cluster into the env vars.
3. **Resend** (magic-link email): create an API key (`AUTH_RESEND_KEY`) and set `EMAIL_FROM`. Verify your domain, or use `onboarding@resend.dev` while testing (it only delivers to your own address).
4. **Google / GitHub OAuth**: create apps with callback URLs `https://YOUR-DOMAIN/api/auth/callback/google` and `.../github`.
5. `AUTH_SECRET`: run `npx auth secret`.
6. Push to GitHub, import in Vercel, add every variable from `env.example`, deploy.

Local dev: copy `env.example` to `.env.local`, then `npm i && npm run dev`.
