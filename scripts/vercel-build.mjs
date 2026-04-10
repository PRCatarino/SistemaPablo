import { spawnSync } from "node:child_process";

function run(label, cmd, args) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const skip =
  process.env.SKIP_PRISMA_MIGRATE === "1" ||
  process.env.SKIP_PRISMA_MIGRATE === "true";

if (!skip) {
  const migrate = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (migrate.status !== 0) {
    console.error(`
[vercel-build] prisma migrate deploy falhou. Causas comuns:
  • DIRECT_URL deve ser Postgres direto (db.<ref>.supabase.co:5432 + ?sslmode=require), não 127.0.0.1 nem pooler :6543.
  • DATABASE_URL na Vercel = pooler Transaction :6543 com ?pgbouncer=true.
  • Senha com caracteres especiais na URL: codifique (ex. @ → %40).

Desbloquear o deploy sem migrar no build (rode migrate depois no seu PC ou no SQL Editor):
  Vercel → Environment Variables → SKIP_PRISMA_MIGRATE = 1
`);
    process.exit(migrate.status ?? 1);
  }
}

run("prisma generate", "npx", ["prisma", "generate"]);
run("next build", "npx", ["next", "build"]);
