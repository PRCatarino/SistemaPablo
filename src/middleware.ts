import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Não usar `NextAuth(authConfig)` aqui: com AUTH_URL=http://localhost o next-auth
 * faz `reqWithEnvURL` e troca a origem do pedido por localhost, e redirects
 * (`new URL("/login", req.url)`) passam a apontar para localhost na Vercel.
 * getToken só lê o cookie + AUTH_SECRET e usa sempre o host real do pedido.
 */
const publicAuthPaths = new Set(["/login"]);

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublic = publicAuthPaths.has(path);
  const isHttps = request.nextUrl.protocol === "https:";

  let token = null;
  try {
    token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: isHttps,
    });
  } catch {
    if (!isPublic) {
      return new NextResponse("Defina AUTH_SECRET nas variáveis de ambiente.", {
        status: 500,
      });
    }
  }

  if (!token && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("callbackUrl", path === "/" ? "/" : path);
    return NextResponse.redirect(url);
  }

  if (token && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
