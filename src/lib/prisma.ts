import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl } from "@/lib/database-url";

/**
 * Um único PrismaClient por instância serverless (Vercel). Sem isto, cada import
 * abre novas ligações ao Postgres e o pool esgota → P1001 / InitializationError.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
    ...(databaseUrl
      ? { datasources: { db: { url: databaseUrl } } }
      : {}),
  });

globalForPrisma.prisma = prisma;

const vercelDbTarget =
  process.env.DATABASE_URL_TEST?.trim() || process.env.DATABASE_URL?.trim();
if (
  process.env.VERCEL === "1" &&
  vercelDbTarget &&
  (vercelDbTarget.includes("127.0.0.1") ||
    vercelDbTarget.includes("localhost"))
) {
  console.error(
    "[prisma] DATABASE_URL (ou DATABASE_URL_TEST) aponta para localhost na Vercel — defina a connection string do Postgres nas Environment Variables.",
  );
}
