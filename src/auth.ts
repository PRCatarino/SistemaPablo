import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@/lib/kanban-types";
import { authConfig } from "@/auth.config";

const ROLES: Role[] = [
  "administrador",
  "atendente",
  "designer",
  "finalizador",
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "credentials",
      credentials: {
        username: { label: "Nome de usuário", type: "text" },
        role: { label: "Cargo", type: "text" },
      },
      authorize: async (credentials) => {
        const username = (credentials?.username as string | undefined)?.trim();
        const role = credentials?.role as string | undefined;
        if (!username || !role || !(ROLES as string[]).includes(role)) {
          return null;
        }
        return {
          id: crypto.randomUUID(),
          name: username,
          email: `${username.replace(/\s+/g, ".").toLowerCase()}@kanban.local`,
          role: role as Role,
        };
      },
    }),
  ],
});
