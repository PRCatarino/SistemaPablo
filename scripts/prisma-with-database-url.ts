/**
 * Executa o Prisma CLI com DATABASE_URL resolvida a partir de DATABASE_URL_TEST || DATABASE_URL
 * (mesma regra que src/lib/database-url.ts), para migrate deploy/dev/studio sem ambiguidade.
 */
import { spawnSync } from "node:child_process";
import { resolveDatabaseUrl } from "../src/lib/database-url";
import { loadEnvFiles } from "./load-env-files";

loadEnvFiles();

const resolved = resolveDatabaseUrl();
if (!resolved) {
  console.error("Defina DATABASE_URL_TEST ou DATABASE_URL.");
  process.exit(1);
}

const [, , ...prismaArgs] = process.argv;
if (prismaArgs.length === 0) {
  console.error(
    "Uso: tsx scripts/prisma-with-database-url.ts <args do prisma...>",
  );
  console.error('Ex.: tsx scripts/prisma-with-database-url.ts migrate deploy');
  process.exit(1);
}

const env = { ...process.env, DATABASE_URL: resolved };
const r = spawnSync("npx", ["prisma", ...prismaArgs], {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});

process.exit(r.status ?? 1);
