import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl } from "../src/lib/database-url";
import { loadEnvFiles } from "./load-env-files";

loadEnvFiles();

async function main() {
  const url = resolveDatabaseUrl();
  if (!url) {
    console.error(
      "Defina DATABASE_URL_TEST ou DATABASE_URL (ex.: em .env.local).",
    );
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Prisma OK: SELECT 1");
    const n = await prisma.shirtArtCard.count();
    console.log("shirt_art_cards count:", n);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Prisma FAIL:", msg);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
