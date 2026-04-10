"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Card, ColumnId } from "@/lib/kanban-types";
import { COLUMN_LABELS } from "@/lib/kanban-types";
import {
  COLUMN_THREAD_GRADIENT,
  columnShellClass,
} from "@/lib/column-styles";
import { MaterialIcon } from "@/components/MaterialIcon";
import { KanbanCard } from "./KanbanCard";

type Props = {
  columnId: ColumnId;
  cards: Card[];
};

export function KanbanColumn({ columnId, cards }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  const thread = COLUMN_THREAD_GRADIENT[columnId];
  const isDone = columnId === "finalizado";

  return (
    <div className="flex h-full min-w-[200px] max-w-[220px] shrink-0 flex-col">
      <div
        className={[
          "flex h-full min-h-[min(72vh,620px)] flex-col overflow-hidden rounded-xl shadow-sm",
          columnShellClass(columnId),
          isOver ? "ring-2 ring-secondary ring-offset-2 ring-offset-surface" : "",
        ].join(" ")}
      >
        <div className="flex items-center justify-between p-4">
          <h3
            className={[
              "flex items-center gap-2 font-headline text-xs font-bold tracking-wider uppercase",
              isDone ? "text-on-surface-variant" : "text-primary",
            ].join(" ")}
          >
            {COLUMN_LABELS[columnId]}
            <span
              className={[
                "rounded px-2 py-0.5 text-[10px] font-bold",
                isDone
                  ? "bg-surface-container-highest text-on-surface-variant"
                  : "bg-primary-container text-on-primary",
              ].join(" ")}
            >
              {cards.length}
            </span>
          </h3>
          <button
            type="button"
            className="rounded p-1 text-on-surface-variant hover:bg-surface-container-high"
            aria-label="Opções da coluna"
          >
            <MaterialIcon name="more_horiz" className="text-[20px]" />
          </button>
        </div>
        <div
          className={`mb-2 h-[2px] w-full bg-gradient-to-r ${thread}`}
          aria-hidden
        />
        <div
          ref={setNodeRef}
          className="hide-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto p-3"
        >
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}
