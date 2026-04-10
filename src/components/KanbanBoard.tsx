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
import { MaterialIcon } from "@/components/MaterialIcon";
import { KanbanColumn } from "./KanbanColumn";
import { NewSolicitationModal } from "./NewSolicitationModal";

function CardDragPreview({ card }: { card: Card }) {
  return (
    <div className="min-w-[180px] rounded-lg border-l-4 border-l-secondary bg-surface-container-lowest px-3 py-2 shadow-[0px_12px_32px_rgba(25,28,30,0.06)]">
      <p className="font-headline text-sm font-extrabold text-primary">
        {card.clientName}
      </p>
      <p className="mt-0.5 text-xs text-on-surface-variant">
        {COLUMN_LABELS[card.columnId]}
      </p>
    </div>
  );
}

function SidebarNav() {
  const items = [
    { icon: "precision_manufacturing", label: "Production", active: true },
    { icon: "monitoring", label: "Loom Monitor", active: false },
    { icon: "inventory_2", label: "Inventory", active: false },
    { icon: "verified", label: "Quality Control", active: false },
    { icon: "local_shipping", label: "Shipments", active: false },
  ] as const;

  return (
    <aside className="fixed top-0 bottom-0 left-0 z-40 hidden w-64 flex-col bg-surface-container-low pt-20 md:flex">
      <div className="mb-8 flex items-center gap-3 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-on-primary">
          <MaterialIcon name="factory" />
        </div>
        <div>
          <h2 className="font-headline text-lg font-black leading-tight text-primary">
            Industrial Atelier
          </h2>
          <p className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
            Main facility
          </p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ icon, label, active }) => (
          <button
            key={label}
            type="button"
            disabled={!active}
            title={active ? undefined : "Em breve"}
            className={[
              "flex w-full items-center gap-3 px-3 py-3 text-left transition-all",
              active
                ? "translate-x-1 border-r-4 border-secondary bg-cyan-50/50 font-semibold text-secondary"
                : "cursor-not-allowed text-slate-500 opacity-70",
            ].join(" ")}
          >
            <MaterialIcon name={icon} />
            <span className="font-label text-[0.6875rem] uppercase tracking-wider">
              {label}
            </span>
          </button>
        ))}
      </nav>
      <div className="space-y-1 border-t border-slate-200/50 px-3 pt-4 pb-6">
        <button
          type="button"
          className="flex w-full cursor-not-allowed items-center gap-3 px-3 py-2 text-slate-400 opacity-70"
          title="Em breve"
        >
          <MaterialIcon name="analytics" className="text-[20px]" />
          <span className="font-label text-[10px] font-semibold uppercase tracking-wider">
            System status
          </span>
        </button>
        <button
          type="button"
          className="flex w-full cursor-not-allowed items-center gap-3 px-3 py-2 text-slate-400 opacity-70"
          title="Em breve"
        >
          <MaterialIcon name="help" className="text-[20px]" />
          <span className="font-label text-[10px] font-semibold uppercase tracking-wider">
            Help
          </span>
        </button>
      </div>
    </aside>
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
    const targetColumn = resolveDropColumn(
      over?.id ? String(over.id) : undefined
    );
    if (!card || !targetColumn || !currentUser) return;
    if (!canMoveCard(currentUser.role, card.columnId, targetColumn)) return;
    void moveCardToColumn(cardId, targetColumn);
  }

  function handleDragCancel() {
    setActiveCard(null);
  }

  if (status === "loading" || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface font-body text-sm text-on-surface-variant">
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
      <div className="min-h-screen bg-surface font-body text-on-surface">
        <header className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-none bg-[#002045] px-6 py-3 shadow-lg">
          <div className="flex items-center gap-8 pl-0 md:pl-0">
            <div className="font-headline text-xl font-bold tracking-widest text-white uppercase md:ml-64">
              ArtFlow
            </div>
            <nav className="hidden gap-6 md:flex">
              <span className="border-b-2 border-cyan-400 pb-1 font-headline text-sm font-semibold tracking-wider text-white uppercase">
                Dashboard
              </span>
              <span
                className="cursor-not-allowed pb-1 font-headline text-sm tracking-wider text-slate-300 uppercase opacity-60"
                title="Em breve"
              >
                Analytics
              </span>
              <span
                className="cursor-not-allowed pb-1 font-headline text-sm tracking-wider text-slate-300 uppercase opacity-60"
                title="Em breve"
              >
                Reports
              </span>
            </nav>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 md:gap-4">
            {showNova ? (
              <button
                type="button"
                onClick={() => setNewCardOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-gradient-to-br from-primary to-primary-container px-4 py-2 font-headline text-sm font-bold tracking-tight text-on-primary transition-all hover:opacity-90"
              >
                <MaterialIcon name="add_circle" className="text-[20px]" />
                <span className="hidden sm:inline">Nova solicitação</span>
              </button>
            ) : null}
            <div className="mx-1 hidden h-8 w-px bg-white/20 sm:block" />
            <div className="flex items-center gap-2 text-slate-300">
              <button
                type="button"
                className="cursor-not-allowed rounded-full p-2 opacity-50"
                title="Em breve"
                aria-disabled
              >
                <MaterialIcon name="notifications" />
              </button>
              <button
                type="button"
                className="cursor-not-allowed rounded-full p-2 opacity-50"
                title="Em breve"
                aria-disabled
              >
                <MaterialIcon name="settings" />
              </button>
            </div>
            <div className="flex items-center gap-3 pl-1">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-bold leading-tight text-white">
                  {currentUser.name}
                </p>
                <p className="text-[10px] tracking-tighter text-slate-400 uppercase">
                  {ROLE_LABELS[currentUser.role]}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-primary-container font-headline text-xs font-bold text-on-primary">
                {currentUser.name.trim().charAt(0).toUpperCase() || "?"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 font-label text-[10px] font-semibold tracking-wider text-white uppercase hover:bg-white/10"
            >
              Sair
            </button>
          </div>
        </header>

        <SidebarNav />

        <main className="ml-0 min-h-screen pt-20 pb-8 md:ml-64 md:px-8 md:pt-20">
          <div className="mb-6 mt-4 flex flex-col gap-4 px-3 sm:flex-row sm:items-end sm:justify-between md:px-0">
            <div>
              <h1 className="mb-1 font-headline text-2xl font-extrabold tracking-tight text-primary uppercase sm:text-3xl">
                Production pipeline
              </h1>
              <p className="font-medium text-on-surface-variant">
                Status em tempo real das solicitações de arte.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-surface-container-highest px-4 py-2 font-headline text-xs font-bold tracking-widest text-primary uppercase opacity-70"
                title="Em breve"
              >
                <MaterialIcon name="filter_list" className="text-[18px]" />
                Filter
              </button>
            </div>
          </div>

          <div className="overflow-x-auto px-3 pb-4 md:px-0">
            <div className="mx-auto flex min-h-[min(72vh,620px)] min-w-[1200px] gap-4 max-w-[1920px]">
              {COLUMN_ORDER.map((col) => (
                <KanbanColumn
                  key={col}
                  columnId={col}
                  cards={cardsByColumn.get(col) ?? []}
                />
              ))}
            </div>
          </div>
        </main>
      </div>

      <NewSolicitationModal />

      <DragOverlay dropAnimation={null}>
        {activeCard ? <CardDragPreview card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
