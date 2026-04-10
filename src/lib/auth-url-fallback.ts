/**
 * Na Vercel, se AUTH_URL vier do .env local (localhost), o NextAuth redireciona para localhost.
 * Usa VERCEL_URL (injetada pela Vercel) quando AUTH_URL está vazio ou é localhost.
 * Com domínio próprio, defina AUTH_URL explicitamente na Vercel.
 */
const vercel = process.env.VERCEL === "1";
const vercelUrl = process.env.VERCEL_URL;
const authUrl = process.env.AUTH_URL;

if (vercel && vercelUrl && (!authUrl || authUrl.includes("localhost"))) {
  process.env.AUTH_URL = `https://${vercelUrl}`;
}
