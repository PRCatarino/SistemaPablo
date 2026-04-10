import type { ColumnId, Role } from "./kanban-types";
import { COLUMN_ORDER } from "./kanban-types";

export function columnIndex(columnId: ColumnId): number {
  return COLUMN_ORDER.indexOf(columnId);
}

const TRANSITIONS: Record<
  Role,
  readonly (readonly [ColumnId, ColumnId])[]
> = {
  administrador: [],
  atendente: [
    ["nova_solicitacao", "designer_pendente"],
    ["designer_pendente", "nova_solicitacao"],
    ["aguardando_aprovacao", "aguardando_finalizacao"],
    ["aguardando_finalizacao", "aguardando_aprovacao"],
  ],
  designer: [
    ["designer_pendente", "designer_em_producao"],
    ["designer_em_producao", "designer_pendente"],
    ["designer_em_producao", "aguardando_aprovacao"],
    ["aguardando_aprovacao", "designer_em_producao"],
    ["designer_pendente", "aguardando_aprovacao"],
    ["aguardando_aprovacao", "designer_pendente"],
  ],
  finalizador: [
    ["aguardando_finalizacao", "finalizado"],
    ["finalizado", "aguardando_finalizacao"],
  ],
};

export function canMoveCard(
  role: Role,
  from: ColumnId,
  to: ColumnId
): boolean {
  if (from === to) return false;
  if (role === "administrador") return true;
  const list = TRANSITIONS[role];
  return list.some(([a, b]) => a === from && b === to);
}

/** Pode arrastar se existir alguma coluna de destino permitida (não só vizinha). */
export function canDragCard(role: Role, from: ColumnId): boolean {
  if (role === "administrador") return true;
  for (const col of COLUMN_ORDER) {
    if (col !== from && canMoveCard(role, from, col)) return true;
  }
  return false;
}

export function adjacentColumn(
  columnId: ColumnId,
  direction: "prev" | "next"
): ColumnId | null {
  const i = columnIndex(columnId);
  if (direction === "prev") {
    if (i <= 0) return null;
    return COLUMN_ORDER[i - 1]!;
  }
  if (i >= COLUMN_ORDER.length - 1) return null;
  return COLUMN_ORDER[i + 1]!;
}

export function canCreateCard(role: Role): boolean {
  return role === "administrador" || role === "atendente";
}
