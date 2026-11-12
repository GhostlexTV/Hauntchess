// GitHub's web uploader rejects folder names with [brackets], so the dynamic route folder is created here at build time.
import fs from "fs";
fs.mkdirSync("app/api/game/[id]", {recursive: true});
fs.copyFileSync("routes-src/game.ts", "app/api/game/[id]/route.ts");
