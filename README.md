# Chess — Vercel + Neon + Pusher
1. **Neon**: run `schema.sql` in the SQL Editor; copy the connection string to `DATABASE_URL`.
2. **Pusher Channels** (only needed for online matches): create an app and fill the four PUSHER variables.
3. Optional: set `AUTH_SECRET` to a long random string.
4. Push to GitHub, import in Vercel, add the variables from `env.example`, deploy.
Sign-up checks the email format and that its domain can receive mail.
