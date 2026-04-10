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
import { MaterialIcon } from "@/components/MaterialIcon";
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
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function shortCardId(id: string) {
  const tail = id.replace(/\W/g, "").slice(-5).toUpperCase();
  return tail || id.slice(0, 5).toUpperCase();
}

type Props = { card: Card };

export function KanbanCard({ card }: Props) {
  const { currentUser, moveCardToColumn } = useKanban();
  const [detailOpen, setDetailOpen] = useState(false);

  const role = currentUser?.role;
  const dragAllowed = !!role && canDragCard(role, card.columnId);
  const isFinal = card.columnId === "finalizado";
  const inProduction = card.columnId === "designer_em_producao";

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

  const threadBorder = inProduction
    ? "border-l-secondary"
    : isFinal
      ? "border-l-outline-variant"
      : "border-l-secondary/80";

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={[
          "relative max-w-[240px] min-w-[200px] select-none rounded-lg bg-surface-container-lowest p-4 shadow-sm",
          "border-l-4",
          threadBorder,
          dragAllowed ? "cursor-grab hover:translate-x-0.5 active:cursor-grabbing" : "",
          inProduction ? "bg-secondary/8 ring-1 ring-secondary/35" : "",
          isFinal ? "grayscale transition-all hover:grayscale-0" : "",
        ].join(" ")}
      >
        <div className="flex items-stretch gap-0">
          {canPrev ? (
            <button
              type="button"
              aria-label="Mover para etapa anterior"
              onClick={() => prevCol && void moveCardToColumn(card.id, prevCol)}
              className="flex shrink-0 items-center justify-center px-1 py-1 text-on-surface-variant hover:text-primary"
            >
              <ChevronLeft />
            </button>
          ) : (
            <span className="w-6 shrink-0" aria-hidden />
          )}
          <div
            {...(dragAllowed ? listeners : {})}
            {...(dragAllowed ? attributes : {})}
            className={[
              "min-w-0 flex-1 touch-none",
              dragAllowed ? "" : "",
            ].join(" ")}
          >
            <button
              type="button"
              onClick={() => setDetailOpen(true)}
              className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 rounded-sm"
            >
              <div className="mb-1 flex items-center gap-1.5">
                <p className="text-[10px] font-bold tracking-tighter text-on-surface-variant uppercase">
                  Cód.: #{shortCardId(card.id)}
                </p>
                {card.designerReturnReason ? (
                  <span
                    className="inline-flex items-center rounded bg-error-container/80 px-1 py-0.5 text-error"
                    title={card.designerReturnReason}
                  >
                    <MaterialIcon
                      name="warning"
                      filled
                      className="text-[14px]"
                    />
                  </span>
                ) : null}
              </div>
              <h4
                className={[
                  "mb-2 font-headline text-sm font-extrabold leading-snug",
                  isFinal ? "text-on-surface-variant" : "text-primary",
                ].join(" ")}
              >
                {card.clientName}
              </h4>
              <div className="mb-3 flex items-center gap-2 text-on-surface-variant">
                <MaterialIcon name="calendar_today" className="text-[16px]" />
                <span className="text-[11px] font-semibold">
                  {formatShortDate(card.requestDate)}
                </span>
              </div>
            </button>
          </div>
          {canNext ? (
            <button
              type="button"
              aria-label="Mover para próxima etapa"
              onClick={() => nextCol && void moveCardToColumn(card.id, nextCol)}
              className="flex shrink-0 items-center justify-center px-1 py-1 text-on-surface-variant hover:text-primary"
            >
              <ChevronRight />
            </button>
          ) : (
            <span className="w-6 shrink-0" aria-hidden />
          )}
        </div>

        <div className="mt-1 flex items-center justify-between border-t border-outline-variant/10 pt-2">
          <span className="text-[10px] font-medium tracking-wide text-on-surface-variant uppercase">
            {COLUMN_LABELS[card.columnId]}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDetailOpen(true)}
              className="text-[10px] font-bold text-secondary uppercase tracking-tight hover:underline"
            >
              Abrir
            </button>
            {dragAllowed ? (
              <MaterialIcon
                name="drag_indicator"
                className="text-outline-variant text-[18px]"
              />
            ) : null}
          </div>
        </div>
      </div>
      <CardDetailDialog
        card={card}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}
