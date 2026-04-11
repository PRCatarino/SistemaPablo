import type { NextConfig } from "next";

/** Sem `output: "standalone"`: na Vercel o modo standalone quebra o deploy (404 em rotas/static). */
const nextConfig: NextConfig = {};

export default nextConfig;
