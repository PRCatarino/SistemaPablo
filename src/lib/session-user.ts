import type { Session } from "next-auth";
import type { Role, SessionKanbanUser } from "@/lib/kanban-types";

const ROLES: Role[] = [
  "administrador",
  "atendente",
  "designer",
  "finalizador",
];

function isRole(x: string | undefined): x is Role {
  return !!x && (ROLES as string[]).includes(x);
}

export function sessionToKanbanUser(session: Session | null): SessionKanbanUser | null {
  if (!session?.user?.id || !session.user.name) return null;
  const role = session.user.role;
  if (!isRole(role)) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    role,
  };
}
