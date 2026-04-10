import type { NextConfig } from "next";

/** Sem `output: "standalone"` aqui: na Vercel o modo standalone quebra o deploy (404 em rotas/static).
 *  Docker/VPS: o Dockerfile usa `next build` + `next start` com a pasta `.next` completa — não precisa de standalone. */
const nextConfig: NextConfig = {};

export default nextConfig;
