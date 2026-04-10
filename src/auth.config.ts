import "@/lib/auth-url-fallback";
import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/kanban-types";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.role = user.role as Role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.name = (token.name as string) ?? "";
        session.user.role = (token.role as Role) ?? "atendente";
      }
      return session;
    },
  },
};
