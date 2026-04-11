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
import { useEffect, useMemo, useState } from "react";
import { useKanban } from "@/context/KanbanContext";
import type { Card, ColumnId } from "@/lib/kanban-types";
import { COLUMN_LABELS, COLUMN_ORDER, ROLE_LABELS } from "@/lib/kanban-types";
import { canCreateCard, canMoveCard } from "@/lib/permissions";
import { MaterialIcon } from "@/components/MaterialIcon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SimpleDialog } from "@/components/SimpleDialog";
import {
  KanbanAlternateViews,
  type ShellView,
} from "@/components/KanbanAlternateViews";
import { KanbanColumn } from "./KanbanColumn";
import { NewSolicitationModal } from "./NewSolicitationModal";

function CardDragPreview({ card }: { card: Card }) {
  return (
    <div className="min-w-[180px] rounded-lg border-l-4 border-l-secondary bg-surface-container-lowest px-3 py-2 shadow-[0px_12px_32px_rgba(25,28,30,0.06)] dark:shadow-[0px_12px_32px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-1.5">
        <p className="font-headline text-sm font-extrabold text-primary">
          {card.clientName}
        </p>
        {card.designerReturnReason ? (
          <MaterialIcon
            name="warning"
            filled
            className="text-[16px] text-error"
          />
        ) : null}
      </div>
      <p className="mt-0.5 text-xs text-on-surface-variant">
        {COLUMN_LABELS[card.columnId]}
      </p>
    </div>
  );
}

function escapeCsvCell(s: string): string {
  return `"${String(s).replace(/"/g, '""')}"`;
}

function buildCardsCsv(cards: Card[]): string {
  const header = ["id", "cliente", "telefone", "coluna", "data_solicitacao"];
  const lines = [header.join(",")];
  for (const c of cards) {
    lines.push(
      [
        escapeCsvCell(c.id),
        escapeCsvCell(c.clientName),
        escapeCsvCell(c.clientPhone),
        escapeCsvCell(COLUMN_LABELS[c.columnId]),
        escapeCsvCell(c.requestDate),
      ].join(",")
    );
  }
  return "\uFEFF" + lines.join("\n");
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function SidebarNav({
  activeView,
  onView,
}: {
  activeView: ShellView;
  onView: (v: ShellView) => void;
}) {
  const items: { id: ShellView; icon: string; label: string }[] = [
    { id: "production", icon: "precision_manufacturing", label: "Produção" },
    { id: "analytics", icon: "monitoring", label: "Monitor de produção" },
    { id: "inventory", icon: "inventory_2", label: "Estoque" },
    { id: "quality", icon: "verified", label: "Controle de qualidade" },
    { id: "shipments", icon: "local_shipping", label: "Expedição" },
  ];

  const itemClass = (active: boolean) =>
    [
      "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-all",
      active
        ? "translate-x-1 border-r-4 border-secondary bg-secondary/12 font-semibold text-secondary"
        : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary",
    ].join(" ");

  return (
    <aside className="fixed top-0 bottom-0 left-0 z-40 hidden w-64 flex-col bg-surface-container-low pt-20 md:flex">
      <div className="mb-8 flex items-center gap-3 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-on-primary">
          <MaterialIcon name="factory" />
        </div>
        <div>
          <h2 className="font-headline text-lg font-black leading-tight text-primary">
            Ateliê industrial
          </h2>
          <p className="text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">
            Unidade principal
          </p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ id, icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onView(id)}
            className={itemClass(activeView === id)}
          >
            <MaterialIcon name={icon} />
            <span className="font-label text-[0.6875rem] uppercase tracking-wider">
              {label}
            </span>
          </button>
        ))}
      </nav>
      <div className="space-y-1 border-t border-outline-variant/30 px-3 pt-4 pb-6">
        <button
          type="button"
          onClick={() => onView("status")}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
        >
          <MaterialIcon name="analytics" className="text-[20px]" />
          <span className="font-label text-[10px] font-semibold uppercase tracking-wider">
            Status do sistema
          </span>
        </button>
        <button
          type="button"
          onClick={() => onView("help")}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
        >
          <MaterialIcon name="help" className="text-[20px]" />
          <span className="font-label text-[10px] font-semibold uppercase tracking-wider">
            Ajuda
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
    refetchKanban,
    returnReasonPrompt,
    cancelDesignerReturnPrompt,
    confirmDesignerReturnPrompt,
  } = useKanban();

  const [shellView, setShellView] = useState<ShellView>("production");
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const [returnReasonDraft, setReturnReasonDraft] = useState("");
  const [returnReasonError, setReturnReasonError] = useState<string | null>(
    null
  );

  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [columnMenu, setColumnMenu] = useState<ColumnId | null>(null);

  useEffect(() => {
    if (shellView !== "production") setColumnMenu(null);
  }, [shellView]);

  useEffect(() => {
    if (returnReasonPrompt) {
      setReturnReasonDraft("");
      setReturnReasonError(null);
    }
  }, [returnReasonPrompt]);

  const [draftSearch, setDraftSearch] = useState("");
  const [draftCols, setDraftCols] = useState<ColumnId[]>([...COLUMN_ORDER]);
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedCols, setAppliedCols] = useState<ColumnId[]>([...COLUMN_ORDER]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const filteredCards = useMemo(() => {
    let list = visibleCards;
    const q = appliedSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.clientName.toLowerCase().includes(q) ||
          c.clientPhone.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
          c.clientPhone.toLowerCase().includes(q)
      );
    }
    const colSet = new Set(appliedCols);
    if (colSet.size < COLUMN_ORDER.length) {
      list = list.filter((c) => colSet.has(c.columnId));
    }
    return list;
  }, [visibleCards, appliedSearch, appliedCols]);

  const cardsByColumn = useMemo(() => {
    const map = new Map<ColumnId, Card[]>();
    for (const col of COLUMN_ORDER) map.set(col, []);
    for (const c of filteredCards) {
      const list = map.get(c.columnId);
      if (list) list.push(c);
    }
    return map;
  }, [filteredCards]);

  function resolveDropColumn(overId: string | undefined): ColumnId | null {
    if (!overId) return null;
    if (COLUMN_ORDER.includes(overId as ColumnId)) return overId as ColumnId;
    const overCard = filteredCards.find((c) => c.id === overId);
    return overCard ? overCard.columnId : null;
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    const card = filteredCards.find((c) => c.id === id);
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

  function applyFilter() {
    setAppliedSearch(draftSearch);
    setAppliedCols([...draftCols]);
    setFilterOpen(false);
  }

  function clearFilter() {
    setDraftSearch("");
    setDraftCols([...COLUMN_ORDER]);
    setAppliedSearch("");
    setAppliedCols([...COLUMN_ORDER]);
    setFilterOpen(false);
  }

  function toggleDraftCol(col: ColumnId) {
    setDraftCols((prev) => {
      const has = prev.includes(col);
      if (has) {
        const next = prev.filter((c) => c !== col);
        return next.length === 0 ? [...COLUMN_ORDER] : next;
      }
      return [...prev, col].sort(
        (a, b) => COLUMN_ORDER.indexOf(a) - COLUMN_ORDER.indexOf(b)
      );
    });
  }

  function scrollColumnTop(columnId: ColumnId) {
    document
      .getElementById(`kanban-col-scroll-${columnId}`)
      ?.scrollTo({ top: 0, behavior: "smooth" });
    setColumnMenu(null);
  }

  if (status === "loading" || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface font-body text-sm text-on-surface-variant">
        Carregando quadro…
      </div>
    );
  }

  const showNova = canCreateCard(currentUser.role);
  const filterActive =
    appliedSearch.trim() !== "" || appliedCols.length < COLUMN_ORDER.length;
  const columnMenuCardCount =
    columnMenu !== null
      ? (cardsByColumn.get(columnMenu)?.length ?? 0)
      : 0;

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
            <button
              type="button"
              onClick={() => setShellView("production")}
              className="text-left font-headline text-xl font-bold tracking-widest text-white uppercase md:ml-64 hover:opacity-90"
            >
              ArtFlow
            </button>
            <nav className="hidden gap-6 md:flex">
              <button
                type="button"
                onClick={() => setShellView("production")}
                className={
                  shellView === "production"
                    ? "border-b-2 border-secondary-fixed pb-1 font-headline text-sm font-semibold tracking-wider text-white uppercase"
                    : "pb-1 font-headline text-sm tracking-wider text-white/70 uppercase transition-colors hover:text-white"
                }
              >
                Painel
              </button>
              <button
                type="button"
                onClick={() => setShellView("analytics")}
                className={
                  shellView === "analytics"
                    ? "border-b-2 border-secondary-fixed pb-1 font-headline text-sm font-semibold tracking-wider text-white uppercase"
                    : "pb-1 font-headline text-sm tracking-wider text-white/70 uppercase transition-colors hover:text-white"
                }
              >
                Análises
              </button>
              <button
                type="button"
                onClick={() => setReportsOpen(true)}
                className="pb-1 font-headline text-sm tracking-wider text-white/70 uppercase transition-colors hover:text-white"
              >
                Relatórios
              </button>
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
            <ThemeToggle variant="onBrand" />
            <div className="flex items-center gap-2 text-white/80">
              <button
                type="button"
                onClick={() => setNotifOpen(true)}
                className="rounded-full p-2 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Notificações"
              >
                <MaterialIcon name="notifications" />
              </button>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="rounded-full p-2 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Configurações"
              >
                <MaterialIcon name="settings" />
              </button>
            </div>
            <div className="flex items-center gap-3 pl-1">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-bold leading-tight text-white">
                  {currentUser.name}
                </p>
                <p className="text-[10px] tracking-tighter text-white/55 uppercase">
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

        <SidebarNav activeView={shellView} onView={setShellView} />

        <main className="ml-0 min-h-screen pt-20 pb-8 md:ml-64 md:px-8 md:pt-20">
          {shellView === "production" ? (
            <>
              <div className="mb-6 mt-4 flex flex-col gap-4 px-3 sm:flex-row sm:items-end sm:justify-between md:px-0">
                <div>
                  <h1 className="mb-1 font-headline text-2xl font-extrabold tracking-tight text-primary uppercase sm:text-3xl">
                    Fluxo de produção
                  </h1>
                  <p className="font-medium text-on-surface-variant">
                    Status em tempo real das solicitações de arte.
                    {filterActive ? (
                      <span className="ml-2 font-bold text-secondary">
                        (filtro ativo: {filteredCards.length} de{" "}
                        {visibleCards.length})
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftSearch(appliedSearch);
                      setDraftCols([...appliedCols]);
                      setFilterOpen(true);
                    }}
                    className={[
                      "flex items-center gap-2 rounded-lg px-4 py-2 font-headline text-xs font-bold tracking-widest uppercase transition-all",
                      filterActive
                        ? "bg-secondary text-on-secondary shadow-md hover:opacity-90"
                        : "bg-surface-container-highest text-primary hover:bg-surface-container-high",
                    ].join(" ")}
                  >
                    <MaterialIcon name="filter_list" className="text-[18px]" />
                    Filtro
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
                      onColumnMenu={setColumnMenu}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="mt-4 px-3 md:px-0">
              <KanbanAlternateViews
                view={shellView}
                cards={visibleCards}
                currentUser={currentUser}
                onGoProduction={() => setShellView("production")}
                onRefresh={() => void refetchKanban()}
              />
            </div>
          )}
        </main>
      </div>

      <NewSolicitationModal />

      <SimpleDialog
        open={returnReasonPrompt !== null}
        onClose={() => {
          cancelDesignerReturnPrompt();
          setReturnReasonDraft("");
          setReturnReasonError(null);
        }}
        title="Motivo do retorno ao designer"
        size="lg"
      >
        <p className="mb-3 text-sm text-on-surface-variant">
          A solicitação sairá de <strong>Aguardando aprovação</strong> e voltará
          para <strong>Designer em produção</strong>. Descreva o problema ou o
          ajuste necessário — sem motivo o movimento não é concluído.
        </p>
        <label className="block">
          <span className="font-label text-xs font-semibold uppercase text-on-surface-variant">
            Motivo (obrigatório)
          </span>
          <textarea
            rows={4}
            value={returnReasonDraft}
            onChange={(e) => setReturnReasonDraft(e.target.value)}
            placeholder="Ex.: Logo fora do padrão do briefing; refazer frente conforme referência."
            className="mt-1 w-full rounded-lg border-none bg-surface-container-high px-3 py-2.5 font-body text-sm text-on-surface placeholder:text-outline/50 focus:border-b-2 focus:border-secondary focus:outline-none"
          />
        </label>
        {returnReasonError ? (
          <p
            className="mt-2 text-sm font-semibold text-error"
            role="alert"
          >
            {returnReasonError}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-outline-variant/20 pt-4">
          <button
            type="button"
            onClick={async () => {
              const r = await confirmDesignerReturnPrompt(returnReasonDraft);
              if (r.error) setReturnReasonError(r.error);
            }}
            className="rounded-lg bg-primary px-4 py-2 font-headline text-xs font-bold text-on-primary uppercase"
          >
            Confirmar movimento
          </button>
          <button
            type="button"
            onClick={() => {
              cancelDesignerReturnPrompt();
              setReturnReasonDraft("");
              setReturnReasonError(null);
            }}
            className="rounded-lg border border-outline-variant px-4 py-2 font-headline text-xs font-bold uppercase hover:bg-surface-container-high"
          >
            Cancelar
          </button>
        </div>
      </SimpleDialog>

      <SimpleDialog
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        title="Notificações"
        size="sm"
      >
        <p className="text-on-surface-variant">
          Nenhuma notificação no momento. Pedidos parados nas colunas
          &quot;Aguardando aprovação&quot; aparecerão aqui em versões futuras.
        </p>
        <button
          type="button"
          onClick={() => setNotifOpen(false)}
          className="mt-4 rounded-lg bg-primary px-4 py-2 font-headline text-xs font-bold text-on-primary uppercase"
        >
          Entendi
        </button>
      </SimpleDialog>

      <SimpleDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Configurações"
      >
        <ul className="space-y-3 text-on-surface-variant">
          <li>
            <strong className="text-on-surface">Sessão:</strong> você está
            logado como <strong>{currentUser.name}</strong> (
            {ROLE_LABELS[currentUser.role]}).
          </li>
          <li>
            <strong className="text-on-surface">Dados:</strong> o quadro usa
            PostgreSQL (Supabase) via API.
          </li>
          <li>
            Para trocar de usuário, use <strong>Sair</strong> no topo.
          </li>
        </ul>
        <button
          type="button"
          onClick={() => setSettingsOpen(false)}
          className="mt-4 rounded-lg border border-outline-variant px-4 py-2 font-headline text-xs font-bold uppercase hover:bg-surface-container-high"
        >
          Fechar
        </button>
      </SimpleDialog>

      <SimpleDialog
        open={reportsOpen}
        onClose={() => setReportsOpen(false)}
        title="Relatórios"
        size="lg"
      >
        <p className="mb-4 text-on-surface-variant">
          Exporte todas as solicitações visíveis no sistema ({visibleCards.length}{" "}
          registros) em CSV (abre no Excel e em planilhas).
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              downloadCsv(
                `relatorio-solicitacoes-${new Date().toISOString().slice(0, 10)}.csv`,
                buildCardsCsv(visibleCards)
              );
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 font-headline text-sm font-bold text-on-secondary"
          >
            <MaterialIcon name="download" className="text-[20px]" />
            Baixar CSV completo
          </button>
          <button
            type="button"
            onClick={() => {
              downloadCsv(
                `relatorio-filtrado-${new Date().toISOString().slice(0, 10)}.csv`,
                buildCardsCsv(filteredCards)
              );
            }}
            disabled={!filterActive}
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 font-headline text-sm font-bold disabled:opacity-40"
          >
            <MaterialIcon name="filter_alt" className="text-[20px]" />
            CSV do filtro atual
          </button>
        </div>
        <p className="mt-4 text-xs text-on-surface-variant">
          O relatório filtrado só fica ativo com filtro aplicado no quadro.
        </p>
      </SimpleDialog>

      <SimpleDialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filtrar quadro"
        size="lg"
      >
        <div className="space-y-4">
          <label className="block">
            <span className="font-label text-xs font-semibold uppercase text-on-surface-variant">
              Buscar por cliente ou telefone
            </span>
            <input
              type="search"
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              placeholder="Nome ou telefone…"
              className="mt-1 w-full rounded-lg border-none bg-surface-container-high px-3 py-2.5 font-body text-sm focus:border-b-2 focus:border-secondary focus:outline-none"
            />
          </label>
          <fieldset>
            <legend className="font-label text-xs font-semibold uppercase text-on-surface-variant">
              Colunas visíveis
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLUMN_ORDER.map((col) => (
                <label
                  key={col}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-xs hover:bg-surface-container-high"
                >
                  <input
                    type="checkbox"
                    checked={draftCols.includes(col)}
                    onChange={() => toggleDraftCol(col)}
                    className="rounded border-outline-variant"
                  />
                  {COLUMN_LABELS[col]}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="mt-6 flex flex-wrap gap-2 border-t border-outline-variant/20 pt-4">
          <button
            type="button"
            onClick={applyFilter}
            className="rounded-lg bg-primary px-4 py-2 font-headline text-xs font-bold text-on-primary uppercase"
          >
            Aplicar
          </button>
          <button
            type="button"
            onClick={clearFilter}
            className="rounded-lg border border-outline-variant px-4 py-2 font-headline text-xs font-bold uppercase hover:bg-surface-container-high"
          >
            Limpar tudo
          </button>
          <button
            type="button"
            onClick={() => setFilterOpen(false)}
            className="rounded-lg px-4 py-2 font-headline text-xs font-bold text-on-surface-variant uppercase hover:underline"
          >
            Cancelar
          </button>
        </div>
      </SimpleDialog>

      <SimpleDialog
        open={columnMenu !== null}
        onClose={() => setColumnMenu(null)}
        title={
          columnMenu ? COLUMN_LABELS[columnMenu] : ""
        }
        size="sm"
      >
        {columnMenu ? (
          <>
            <p className="mb-4 text-on-surface-variant">
              {columnMenuCardCount === 1
                ? "1 solicitação nesta coluna."
                : `${columnMenuCardCount} solicitações nesta coluna.`}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => scrollColumnTop(columnMenu)}
                className="flex items-center gap-2 rounded-lg bg-surface-container-high px-3 py-2 text-left text-sm font-medium hover:bg-surface-container-highest"
              >
                <MaterialIcon name="vertical_align_top" className="text-[20px]" />
                Rolar lista ao topo
              </button>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(COLUMN_LABELS[columnMenu]);
                  setColumnMenu(null);
                }}
                className="flex items-center gap-2 rounded-lg bg-surface-container-high px-3 py-2 text-left text-sm font-medium hover:bg-surface-container-highest"
              >
                <MaterialIcon name="content_copy" className="text-[20px]" />
                Copiar nome da coluna
              </button>
            </div>
          </>
        ) : null}
      </SimpleDialog>

      <DragOverlay dropAnimation={null}>
        {activeCard ? <CardDragPreview card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
