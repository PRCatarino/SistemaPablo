"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { useKanban } from "@/context/KanbanContext";
import type { Card } from "@/lib/kanban-types";
import { COLUMN_LABELS } from "@/lib/kanban-types";
import {
  adjacentColumn,
  canDragCard,
  canMoveCard,
} from "@/lib/permissions";
import { CardDetailDialog } from "./CardDetailDialog";

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function formatShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

type Props = { card: Card };

export function KanbanCard({ card }: Props) {
  const { currentUser, moveCardToColumn } = useKanban();
  const [detailOpen, setDetailOpen] = useState(false);

  const role = currentUser?.role;
  const dragAllowed =
    !!role && canDragCard(role, card.columnId);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: card.id,
      disabled: !dragAllowed,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.55 : 1,
  };

  const prevCol = adjacentColumn(card.columnId, "prev");
  const nextCol = adjacentColumn(card.columnId, "next");
  const canPrev =
    !!role &&
    prevCol !== null &&
    canMoveCard(role, card.columnId, prevCol);
  const canNext =
    !!role &&
    nextCol !== null &&
    canMoveCard(role, card.columnId, nextCol);

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={[
          "rounded-lg border border-slate-200/80 bg-white shadow-sm",
          "min-w-[200px] max-w-[240px] select-none",
          dragAllowed ? "cursor-grab active:cursor-grabbing" : "",
        ].join(" ")}
      >
        <div className="flex items-stretch gap-0 border-b border-slate-100">
          {canPrev ? (
            <button
              type="button"
              aria-label="Mover para etapa anterior"
              onClick={() => prevCol && void moveCardToColumn(card.id, prevCol)}
              className="flex shrink-0 items-center justify-center px-2 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            >
              <ChevronLeft />
            </button>
          ) : (
            <span className="w-9 shrink-0" aria-hidden />
          )}
          <div
            {...(dragAllowed ? listeners : {})}
            {...(dragAllowed ? attributes : {})}
            className={[
              "flex-1 min-w-0 py-2 pr-1 pl-1",
              dragAllowed ? "touch-none" : "",
            ].join(" ")}
          >
            <button
              type="button"
              onClick={() => setDetailOpen(true)}
              className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded"
            >
              <p className="text-sm font-medium text-slate-900 leading-snug">
                {card.clientName}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatShortDate(card.requestDate)}
              </p>
            </button>
          </div>
          {canNext ? (
            <button
              type="button"
              aria-label="Mover para próxima etapa"
              onClick={() => nextCol && void moveCardToColumn(card.id, nextCol)}
              className="flex shrink-0 items-center justify-center px-2 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            >
              <ChevronRight />
            </button>
          ) : (
            <span className="w-9 shrink-0" aria-hidden />
          )}
        </div>
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="w-full border-t border-slate-100 px-2 py-1.5 text-left text-[10px] uppercase tracking-wide text-slate-500 hover:bg-slate-50"
        >
          {COLUMN_LABELS[card.columnId]} ·{" "}
          <span className="font-medium text-sky-700 normal-case">
            Abrir painel
          </span>
        </button>
      </div>
      <CardDetailDialog
        card={card}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}
