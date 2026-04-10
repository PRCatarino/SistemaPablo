"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { signOut } from "next-auth/react";
import { useMemo, useState } from "react";
import { useKanban } from "@/context/KanbanContext";
import type { Card, ColumnId } from "@/lib/kanban-types";
import { COLUMN_ORDER, COLUMN_LABELS, ROLE_LABELS } from "@/lib/kanban-types";
import { canCreateCard, canMoveCard } from "@/lib/permissions";
import { KanbanColumn } from "./KanbanColumn";
import { NewSolicitationModal } from "./NewSolicitationModal";

function CardDragPreview({ card }: { card: Card }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg min-w-[180px]">
      <p className="text-sm font-medium text-slate-900">{card.clientName}</p>
      <p className="text-xs text-slate-500 mt-0.5">
        {COLUMN_LABELS[card.columnId]}
      </p>
    </div>
  );
}

export function KanbanBoard() {
  const {
    status,
    currentUser,
    visibleCards,
    moveCardToColumn,
    setNewCardOpen,
  } = useKanban();

  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const cardsByColumn = useMemo(() => {
    const map = new Map<ColumnId, Card[]>();
    for (const col of COLUMN_ORDER) map.set(col, []);
    for (const c of visibleCards) {
      const list = map.get(c.columnId);
      if (list) list.push(c);
    }
    return map;
  }, [visibleCards]);

  function resolveDropColumn(overId: string | undefined): ColumnId | null {
    if (!overId) return null;
    if (COLUMN_ORDER.includes(overId as ColumnId)) return overId as ColumnId;
    const overCard = visibleCards.find((c) => c.id === overId);
    return overCard ? overCard.columnId : null;
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    const card = visibleCards.find((c) => c.id === id);
    setActiveCard(card ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = event;
    const cardId = String(active.id);
    const card = visibleCards.find((c) => c.id === cardId);
    const targetColumn = resolveDropColumn(over?.id ? String(over.id) : undefined);
    if (!card || !targetColumn || !currentUser) return;
    if (!canMoveCard(currentUser.role, card.columnId, targetColumn)) return;
    void moveCardToColumn(cardId, targetColumn);
  }

  function handleDragCancel() {
    setActiveCard(null);
  }

  if (status === "loading" || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-600 text-sm">
        Carregando quadro…
      </div>
    );
  }

  const showNova = canCreateCard(currentUser.role);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="min-h-screen flex flex-col bg-slate-100">
        <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Kanban de artes
              </h1>
              <p className="text-xs text-slate-600">
                {currentUser.name} · {ROLE_LABELS[currentUser.role]}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {showNova ? (
                <button
                  type="button"
                  onClick={() => setNewCardOpen(true)}
                  className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700"
                >
                  + Nova solicitação
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-x-auto px-3 py-4">
          <div className="mx-auto flex min-h-[min(72vh,620px)] gap-2 max-w-[1920px]">
            {COLUMN_ORDER.map((col) => (
              <KanbanColumn
                key={col}
                columnId={col}
                cards={cardsByColumn.get(col) ?? []}
              />
            ))}
          </div>
        </div>
      </div>

      <NewSolicitationModal />

      <DragOverlay dropAnimation={null}>
        {activeCard ? <CardDragPreview card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
