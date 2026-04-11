/**
 * Monta uma URI Postgres válida para o Prisma na Vercel + Supabase.
 *
 * Senhas com ?, +, ^, {, }, #, @, etc. na DATABASE_URL quebram o parser de URL
 * (o ? vira início da query string). Se existir POSTGRES_PASSWORD, substituímos
 * o segmento da senha por encodeURIComponent(POSTGRES_PASSWORD). Caso contrário,
 * re-encodamos a senha já presente na URL quando não estiver só com %XX seguros.
 */
const USERINFO_PREFIX = /^(postgresql?:\/\/)([^:]+):([^@]+)@/;

function replacePasswordInUrl(url: string, encodedPassword: string): string {
  const m = url.match(USERINFO_PREFIX);
  if (!m) return url;
  return `${m[1]}${m[2]}:${encodedPassword}@${url.slice(m[0].length)}`;
}

/** Senha já está só com caracteres literais seguros ou sequências %HH. */
function passwordLooksFullyEncoded(pass: string): boolean {
  return /^([a-zA-Z0-9_.~-]|%[0-9A-Fa-f]{2})+$/.test(pass);
}

export function resolveDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return undefined;

  let url = raw;

  const m = url.match(USERINFO_PREFIX);
  if (m) {
    const fromEnv = process.env.POSTGRES_PASSWORD?.trim();
    const embedded = m[3];

    if (fromEnv) {
      url = replacePasswordInUrl(url, encodeURIComponent(fromEnv));
    } else if (embedded && !passwordLooksFullyEncoded(embedded)) {
      url = replacePasswordInUrl(url, encodeURIComponent(embedded));
    }
  }

  const isSupabase =
    url.includes("supabase.com") || url.includes("supabase.co");
  const isPooler =
    url.includes("pooler.supabase.com") || /:6543(\/|\?|#|$)/.test(url);

  const hasParam = (name: string) =>
    new RegExp(`[?&]${name}=`, "i").test(url);

  const append = (key: string, value: string) => {
    if (hasParam(key)) return;
    url += (url.includes("?") ? "&" : "?") + `${key}=${value}`;
  };

  if (isSupabase && !hasParam("sslmode")) {
    append("sslmode", "require");
  }

  if (isPooler && !hasParam("pgbouncer")) {
    append("pgbouncer", "true");
  }

  if (process.env.VERCEL === "1" && isPooler && !hasParam("connection_limit")) {
    append("connection_limit", "1");
  }

  return url;
}
