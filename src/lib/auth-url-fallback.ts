/**
 * NextAuth aplica `reqWithEnvURL`: se AUTH_URL/NEXTAUTH_URL for localhost, até as
 * rotas /api/auth tratam o pedido como se fosse localhost (CSRF / redirects).
 * No Edge, atribuir a `process.env` pode falhar; o middleware já não depende disso.
 */
const vercel = process.env.VERCEL === "1";
const vercelUrl = process.env.VERCEL_URL;
const rawAuth =
  process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";

const badHost =
  !rawAuth ||
  rawAuth.includes("localhost") ||
  rawAuth.includes("127.0.0.1");

if (vercel && vercelUrl && badHost) {
  const fixed = `https://${vercelUrl}`;
  process.env.AUTH_URL = fixed;
  process.env.NEXTAUTH_URL = fixed;
}
