/**
 * Postgres para Prisma — mesmo espírito do salaoBeleza (`db.ts`): URL limpa, SSL explícito,
 * e prioridade a `DATABASE_URL_TEST` quando definido (banco de teste na VPS).
 *
 * Senhas com ?, +, #, @, etc.: use POSTGRES_PASSWORD ou codifique na URI (%XX).
 */

const USERINFO_PREFIX = /^(postgresql?:\/\/)([^:]+):([^@]+)@/;

/** Evita `DATABASE_URL=DATABASE_URL=postgresql://...` ou prefixo errado por copy-paste. */
export function normalizeDatabaseUrl(raw: string): string {
  let u = raw.trim();
  while (
    u.startsWith("DATABASE_URL=") ||
    u.startsWith("DATABASE_URL_TEST=")
  ) {
    if (u.startsWith("DATABASE_URL_TEST=")) {
      u = u.slice("DATABASE_URL_TEST=".length).trim();
    } else {
      u = u.slice("DATABASE_URL=".length).trim();
    }
  }
  return u;
}

/**
 * Teste (local/CI) vs produção: se `DATABASE_URL_TEST` existir, a app usa essa URI.
 * Na Vercel não defines `DATABASE_URL_TEST` → fica só `DATABASE_URL`.
 */
export function pickRawDatabaseUrl(): string | undefined {
  const test = process.env.DATABASE_URL_TEST?.trim();
  if (test) return normalizeDatabaseUrl(test);
  const main = process.env.DATABASE_URL?.trim();
  if (!main) return undefined;
  return normalizeDatabaseUrl(main);
}

/**
 * TLS: igual ao salaoBeleza — desliga com DATABASE_SSL=false em Postgres na VPS sem TLS.
 * Liga para Neon, Supabase, pooler, ou sslmode=require na URL.
 */
function shouldUseSsl(url: string): boolean {
  const explicit = process.env.DATABASE_SSL?.trim().toLowerCase();
  if (explicit === "false" || explicit === "0") return false;
  if (explicit === "require" || explicit === "true" || explicit === "1") {
    return true;
  }
  const u = url.toLowerCase();
  if (u.includes("sslmode=require") || u.includes("sslmode=verify-full")) {
    return true;
  }
  if (u.includes("sslmode=disable")) return false;
  return (
    u.includes(".neon.tech") ||
    u.includes("pooler.supabase.com") ||
    u.includes(".supabase.co")
  );
}

function replacePasswordInUrl(url: string, encodedPassword: string): string {
  const m = url.match(USERINFO_PREFIX);
  if (!m) return url;
  return `${m[1]}${m[2]}:${encodedPassword}@${url.slice(m[0].length)}`;
}

function passwordLooksFullyEncoded(pass: string): boolean {
  return /^([a-zA-Z0-9_.~-]|%[0-9A-Fa-f]{2})+$/.test(pass);
}

export function resolveDatabaseUrl(): string | undefined {
  const raw = pickRawDatabaseUrl();
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

  const isPooler =
    /pooler\./i.test(url) || /:6543(\/|\?|#|$)/.test(url);

  const hasParam = (name: string) =>
    new RegExp(`[?&]${name}=`, "i").test(url);

  const append = (key: string, value: string) => {
    if (hasParam(key)) return;
    url += (url.includes("?") ? "&" : "?") + `${key}=${value}`;
  };

  if (isPooler && !hasParam("pgbouncer")) {
    append("pgbouncer", "true");
  }

  if (process.env.VERCEL === "1" && isPooler && !hasParam("connection_limit")) {
    append("connection_limit", "1");
  }

  if (!shouldUseSsl(url) && !hasParam("sslmode")) {
    append("sslmode", "disable");
  }

  return url;
}
