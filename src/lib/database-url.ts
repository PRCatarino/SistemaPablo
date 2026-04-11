/**
 * Completa query params que o Prisma + Supabase costumam exigir quando a string
 * colada no painel vem sem eles (erro típico: PrismaClientInitializationError na Vercel).
 */
export function resolveDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return undefined;

  let url = raw;
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
