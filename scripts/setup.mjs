// GitHub's web uploader rejects folder names with [brackets], so Next.js's dynamic route folders are created here at build time.
import fs from "fs";
for (const [src, dst] of [["routes-src/nextauth.ts", "app/api/auth/[...nextauth]/route.ts"], ["routes-src/game.ts", "app/api/game/[id]/route.ts"]]) {
  fs.mkdirSync(dst.replace(/\/[^/]+$/, ""), {recursive: true});
  fs.copyFileSync(src, dst);
}
