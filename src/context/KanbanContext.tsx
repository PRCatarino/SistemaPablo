"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type { Card, ColumnId } from "@/lib/kanban-types";
import { needsDesignerReturnReason } from "@/lib/permissions";
import { sessionToKanbanUser } from "@/lib/session-user";

type Bootstrap = { cards: Card[] };

export type ReturnReasonPrompt = { cardId: string; to: ColumnId };

export type KanbanContextValue = {
  status: "loading" | "authenticated" | "unauthenticated";
  currentUser: ReturnType<typeof sessionToKanbanUser>;
  cards: Card[];
  visibleCards: Card[];
  moveCardToColumn: (
    cardId: string,
    columnId: ColumnId,
    designerReturnReason?: string
  ) => Promise<void>;
  returnReasonPrompt: ReturnReasonPrompt | null;
  cancelDesignerReturnPrompt: () => void;
  confirmDesignerReturnPrompt: (
    reason: string
  ) => Promise<{ error?: string }>;
  patchCardAdmin: (
    cardId: string,
    patch: Record<string, unknown>
  ) => Promise<{ error?: string }>;
  refetchKanban: () => Promise<unknown>;
  /** Falha ao carregar GET /api/cards (ex.: banco ou migrations). */
  kanbanLoadError: string | null;
  newCardOpen: boolean;
  setNewCardOpen: (v: boolean) => void;
};

const KanbanContext = createContext<KanbanContextValue | null>(null);

async function fetchBootstrap(): Promise<Bootstrap> {
  const r = await fetch("/api/cards");
  let body: unknown = {};
  try {
    body = await r.json();
  } catch {
    /* resposta não-JSON (ex.: HTML de erro) */
  }
  const data = body as { cards?: Card[]; error?: string };
  if (!r.ok) {
    throw new Error(
      data.error?.trim() ||
        `Não foi possível carregar o quadro (HTTP ${r.status}).`,
    );
  }
  if (!Array.isArray(data.cards)) {
    throw new Error("Resposta inválida do servidor ao carregar o quadro.");
  }
  return { cards: data.cards };
}

export function KanbanProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const currentUser = sessionToKanbanUser(session);

  const { data, isLoading, refetch, error: queryError, isError } = useQuery({
    queryKey: ["kanban", "cards"],
    queryFn: fetchBootstrap,
    enabled: status === "authenticated",
  });

  const kanbanLoadError = isError
    ? queryError instanceof Error
      ? queryError.message
      : "Falha ao carregar o quadro."
    : null;

  const [newCardOpen, setNewCardOpen] = useState(false);
  const [returnReasonPrompt, setReturnReasonPrompt] =
    useState<ReturnReasonPrompt | null>(null);

  const cards = useMemo(() => data?.cards ?? [], [data]);
  const visibleCards = cards;

  const executeMove = useCallback(
    async (
      cardId: string,
      to: ColumnId,
      designerReturnReason?: string
    ): Promise<{ error?: string }> => {
      const snap = queryClient.getQueryData<Bootstrap>(["kanban", "cards"]);
      const card = snap?.cards.find((c) => c.id === cardId);
      if (!card) return { error: "Solicitação não encontrada." };

      const from = card.columnId;
      if (needsDesignerReturnReason(from, to)) {
        const r = designerReturnReason?.trim();
        if (!r) return { error: "Informe o motivo." };
      }

      const body: Record<string, unknown> = { columnId: to };
      if (needsDesignerReturnReason(from, to)) {
        body.designerReturnReason = designerReturnReason!.trim();
      }

      const res = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        return { error: j.error ?? "Falha ao mover solicitação." };
      }
      const bodyJson = (await res.json()) as { card: Card };
      queryClient.setQueryData(["kanban", "cards"], (old: Bootstrap | undefined) => {
        if (!old) return old;
        return {
          cards: old.cards.map((c) => (c.id === cardId ? bodyJson.card : c)),
        };
      });
      return {};
    },
    [queryClient]
  );

  const moveCardToColumn = useCallback(
    async (
      cardId: string,
      to: ColumnId,
      designerReturnReason?: string
    ): Promise<void> => {
      const snap = queryClient.getQueryData<Bootstrap>(["kanban", "cards"]);
      const card = snap?.cards.find((c) => c.id === cardId);
      if (!card) return;
      const from = card.columnId;
      if (needsDesignerReturnReason(from, to) && !designerReturnReason?.trim()) {
        setReturnReasonPrompt({ cardId, to });
        return;
      }
      await executeMove(cardId, to, designerReturnReason);
    },
    [executeMove, queryClient]
  );

  const cancelDesignerReturnPrompt = useCallback(
    () => setReturnReasonPrompt(null),
    []
  );

  const confirmDesignerReturnPrompt = useCallback(
    async (reason: string) => {
      if (!returnReasonPrompt) return { error: "Nada pendente." };
      const err = await executeMove(
        returnReasonPrompt.cardId,
        returnReasonPrompt.to,
        reason
      );
      if (!err.error) setReturnReasonPrompt(null);
      return err;
    },
    [returnReasonPrompt, executeMove]
  );

  const patchCardAdmin = useCallback(
    async (cardId: string, patch: Record<string, unknown>) => {
      if (currentUser?.role !== "administrador") {
        return { error: "Apenas administradores podem editar solicitações." };
      }
      const r = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        return { error: j.error ?? "Falha ao salvar." };
      }
      const body = (await r.json()) as { card: Card };
      queryClient.setQueryData(["kanban", "cards"], (old: Bootstrap | undefined) => {
        if (!old) return old;
        return {
          cards: old.cards.map((c) => (c.id === cardId ? body.card : c)),
        };
      });
      return {};
    },
    [currentUser?.role, queryClient]
  );

  const value = useMemo<KanbanContextValue>(
    () => ({
      status:
        status === "loading" || (status === "authenticated" && isLoading)
          ? "loading"
          : status === "authenticated"
            ? "authenticated"
            : "unauthenticated",
      currentUser,
      cards,
      visibleCards,
      moveCardToColumn,
      returnReasonPrompt,
      cancelDesignerReturnPrompt,
      confirmDesignerReturnPrompt,
      patchCardAdmin,
      refetchKanban: refetch,
      kanbanLoadError,
      newCardOpen,
      setNewCardOpen,
    }),
    [
      status,
      isLoading,
      currentUser,
      cards,
      visibleCards,
      moveCardToColumn,
      returnReasonPrompt,
      cancelDesignerReturnPrompt,
      confirmDesignerReturnPrompt,
      patchCardAdmin,
      refetch,
      kanbanLoadError,
      newCardOpen,
    ]
  );

  return (
    <KanbanContext.Provider value={value}>{children}</KanbanContext.Provider>
  );
}

export function useKanban() {
  const ctx = useContext(KanbanContext);
  if (!ctx) throw new Error("useKanban dentro de KanbanProvider");
  return ctx;
}
