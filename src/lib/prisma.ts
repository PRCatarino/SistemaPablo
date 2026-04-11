import { PrismaClient } from "@prisma/client";

/**
 * Um único PrismaClient por instância serverless (Vercel). Sem isto, cada import
 * abre novas ligações ao Postgres e o pool do Supabase esgota → P1001 / InitializationError.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

globalForPrisma.prisma = prisma;

if (
  process.env.VERCEL === "1" &&
  process.env.DATABASE_URL &&
  (process.env.DATABASE_URL.includes("127.0.0.1") ||
    process.env.DATABASE_URL.includes("localhost"))
) {
  console.error(
    "[prisma] DATABASE_URL aponta para localhost na Vercel — defina a connection string do Supabase nas Environment Variables.",
  );
}
