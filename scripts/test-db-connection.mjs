import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());
const prisma = new PrismaClient();
try {
  await prisma.$queryRaw`SELECT 1`;
  console.log("Prisma OK: SELECT 1");
  const n = await prisma.shirtArtCard.count();
  console.log("shirt_art_cards count:", n);
} catch (e) {
  console.error("Prisma FAIL:", e?.message ?? e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
