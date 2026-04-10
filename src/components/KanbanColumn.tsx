"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Card, ColumnId } from "@/lib/kanban-types";
import { COLUMN_LABELS } from "@/lib/kanban-types";
import { KanbanCard } from "./KanbanCard";

type Props = {
  columnId: ColumnId;
  cards: Card[];
};

export function KanbanColumn({ columnId, cards }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });

  return (
    <div className="flex h-full min-w-[220px] max-w-[220px] flex-col shrink-0">
      <div className="mb-2 flex items-center justify-between px-0.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-700 leading-tight">
          {COLUMN_LABELS[columnId]}
        </h2>
        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
          {cards.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={[
          "flex flex-1 flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 min-h-[100px]",
          isOver ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-100" : "",
        ].join(" ")}
      >
        {cards.map((card) => (
          <KanbanCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
