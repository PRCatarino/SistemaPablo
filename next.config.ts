import type { NextConfig } from "next";

/** Sem `output: "standalone"`: na Vercel o modo standalone quebra o deploy (404 em rotas/static). */
const nextConfig: NextConfig = {
  /** Vercel expõe o SHA no build; aparece no cliente para confirmar deploy novo. */
  env: {
    NEXT_PUBLIC_BUILD_REF:
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
  },
};

export default nextConfig;
