import type { ColumnId } from "./kanban-types";

/** Barra “thread” no topo da coluna (telas/quadro_kanban_desktop). */
export const COLUMN_THREAD_GRADIENT: Record<ColumnId, string> = {
  nova_solicitacao: "from-secondary-fixed-dim to-secondary",
  designer_pendente: "from-outline-variant to-outline",
  designer_em_producao: "from-secondary-fixed-dim to-secondary",
  aguardando_aprovacao: "from-tertiary-fixed-dim to-tertiary-container",
  aguardando_finalizacao: "from-secondary-fixed-dim to-secondary",
  finalizado: "from-outline-variant to-outline",
};

export function columnShellClass(columnId: ColumnId): string {
  if (columnId === "finalizado") {
    return "bg-surface-container opacity-80";
  }
  return "bg-surface-container-low";
}
