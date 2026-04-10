"use client";

import type {
  Card,
  ColumnId,
  SessionKanbanUser,
} from "@/lib/kanban-types";
import { COLUMN_LABELS, COLUMN_ORDER, ROLE_LABELS } from "@/lib/kanban-types";
import { MaterialIcon } from "@/components/MaterialIcon";

export type ShellView =
  | "production"
  | "analytics"
  | "inventory"
  | "quality"
  | "shipments"
  | "status"
  | "help";

type Props = {
  view: ShellView;
  cards: Card[];
  currentUser: SessionKanbanUser;
  onGoProduction: () => void;
  onRefresh: () => void;
};

export function KanbanAlternateViews({
  view,
  cards,
  currentUser,
  onGoProduction,
  onRefresh,
}: Props) {
  if (view === "production") return null;

  const byCol = (id: ColumnId) => cards.filter((c) => c.columnId === id).length;
  const clients = [...new Set(cards.map((c) => c.clientName))].sort();

  return (
    <div className="rounded-xl bg-surface-container-low p-6 shadow-sm md:p-8">
      {view === "analytics" && (
        <>
          <h2 className="mb-2 font-headline text-xl font-bold text-primary">
            Análises e monitoramento
          </h2>
          <p className="mb-4 text-on-surface-variant">
            Contagem por coluna e atualização dos dados do quadro.
          </p>
          <button
            type="button"
            onClick={() => {
              void onRefresh();
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 font-headline text-sm font-bold text-on-secondary"
          >
            <MaterialIcon name="refresh" className="text-[20px]" />
            Atualizar dados
          </button>
          <p className="mt-6 mb-2 font-label text-xs uppercase text-on-surface-variant">
            Total de solicitações:{" "}
            <span className="text-lg font-bold text-primary">{cards.length}</span>
          </p>
          <ul className="space-y-2 text-sm">
            {COLUMN_ORDER.map((col) => (
              <li
                key={col}
                className="flex justify-between border-b border-outline-variant/20 py-2"
              >
                <span>{COLUMN_LABELS[col]}</span>
                <span className="font-bold text-primary">{byCol(col)}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {view === "inventory" && (
        <>
          <h2 className="mb-2 font-headline text-xl font-bold text-primary">
            Inventário de clientes
          </h2>
          <p className="mb-4 text-on-surface-variant">
            Clientes únicos nas solicitações atuais ({clients.length}).
          </p>
          {clients.length === 0 ? (
            <p className="text-sm italic text-on-surface-variant">
              Nenhuma solicitação ainda.
            </p>
          ) : (
            <ul className="max-h-[50vh] list-inside list-disc space-y-1 overflow-y-auto text-sm">
              {clients.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </>
      )}

      {view === "quality" && (
        <>
          <h2 className="mb-2 font-headline text-xl font-bold text-primary">
            Controle de qualidade
          </h2>
          <p className="mb-4 text-on-surface-variant">
            Itens em &quot;{COLUMN_LABELS.aguardando_aprovacao}&quot; e
            &quot;{COLUMN_LABELS.aguardando_finalizacao}&quot;.
          </p>
          <ul className="space-y-2 text-sm">
            {cards
              .filter(
                (c) =>
                  c.columnId === "aguardando_aprovacao" ||
                  c.columnId === "aguardando_finalizacao"
              )
              .map((c) => (
                <li
                  key={c.id}
                  className="flex justify-between rounded-lg bg-surface-container-lowest px-3 py-2"
                >
                  <span className="font-medium">{c.clientName}</span>
                  <span className="text-xs text-on-surface-variant">
                    {COLUMN_LABELS[c.columnId]}
                  </span>
                </li>
              ))}
          </ul>
          {cards.filter(
            (c) =>
              c.columnId === "aguardando_aprovacao" ||
              c.columnId === "aguardando_finalizacao"
          ).length === 0 ? (
            <p className="text-sm italic text-on-surface-variant">
              Nenhum pedido nessas etapas.
            </p>
          ) : null}
        </>
      )}

      {view === "shipments" && (
        <>
          <h2 className="mb-2 font-headline text-xl font-bold text-primary">
            Expedição / finalização
          </h2>
          <p className="mb-4 text-on-surface-variant">
            Em finalização: {byCol("aguardando_finalizacao")} · Finalizados:{" "}
            {byCol("finalizado")}.
          </p>
          <ul className="max-h-[40vh] space-y-2 overflow-y-auto text-sm">
            {cards
              .filter(
                (c) =>
                  c.columnId === "aguardando_finalizacao" ||
                  c.columnId === "finalizado"
              )
              .map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg bg-surface-container-lowest px-3 py-2"
                >
                  <span className="font-medium">{c.clientName}</span>
                  <span className="ml-2 text-xs text-on-surface-variant">
                    {COLUMN_LABELS[c.columnId]}
                  </span>
                </li>
              ))}
          </ul>
        </>
      )}

      {view === "status" && (
        <>
          <h2 className="mb-2 font-headline text-xl font-bold text-primary">
            Status do sistema
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-label text-xs uppercase text-on-surface-variant">
                Usuário
              </dt>
              <dd className="font-semibold">{currentUser.name}</dd>
            </div>
            <div>
              <dt className="font-label text-xs uppercase text-on-surface-variant">
                Cargo
              </dt>
              <dd className="font-semibold">{ROLE_LABELS[currentUser.role]}</dd>
            </div>
            <div>
              <dt className="font-label text-xs uppercase text-on-surface-variant">
                Total de solicitações
              </dt>
              <dd className="font-semibold">{cards.length}</dd>
            </div>
          </dl>
        </>
      )}

      {view === "help" && (
        <>
          <h2 className="mb-2 font-headline text-xl font-bold text-primary">
            Ajuda rápida
          </h2>
          <ul className="list-inside list-disc space-y-2 text-sm text-on-surface-variant">
            <li>
              Arraste as solicitações entre as colunas conforme seu cargo (o
              administrador move em qualquer etapa).
            </li>
            <li>
              Use as setas na solicitação para mudar de etapa, quando permitido.
            </li>
            <li>Clique na solicitação para ver o briefing e os anexos.</li>
            <li>
              Atendentes criam solicitações; designers e finalizadores seguem o
              fluxo nas colunas permitidas.
            </li>
          </ul>
        </>
      )}

      <div className="mt-8 border-t border-outline-variant/20 pt-4">
        <button
          type="button"
          onClick={onGoProduction}
          className="font-headline text-sm font-bold text-secondary hover:underline"
        >
          ← Voltar ao quadro (Produção)
        </button>
      </div>
    </div>
  );
}
