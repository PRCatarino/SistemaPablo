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
import {
  buildDemoCardFromFormData,
  isKanbanDemo,
  loadDemoCards,
  saveDemoCards,
} from "@/lib/kanban-demo";
import { needsDesignerReturnReason } from "@/lib/permissions";
import { sessionToKanbanUser } from "@/lib/session-user";

type Bootstrap = { cards: Card[] };

export type ReturnReasonPrompt = { cardId: string; to: ColumnId };

type KanbanContextValue = {
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
  createCardFromForm: (form: HTMLFormElement) => Promise<{ error?: string }>;
  newCardOpen: boolean;
  setNewCardOpen: (v: boolean) => void;
};

const KanbanContext = createContext<KanbanContextValue | null>(null);

async function fetchBootstrap(): Promise<Bootstrap> {
  const r = await fetch("/api/cards");
  if (!r.ok) throw new Error("Falha ao carregar quadro");
  return r.json();
}

async function fetchDemoBootstrap(): Promise<Bootstrap> {
  return { cards: loadDemoCards() };
}

export function KanbanProvider({ children }: { children: React.ReactNode }) {
  const demo = isKanbanDemo();
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const currentUser = sessionToKanbanUser(session);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["kanban", "cards"],
    queryFn: demo ? fetchDemoBootstrap : fetchBootstrap,
    enabled: status === "authenticated",
  });

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

      if (demo) {
        const list = loadDemoCards();
        const idx = list.findIndex((c) => c.id === cardId);
        if (idx === -1) return { error: "Solicitação não encontrada." };
        const now = new Date().toISOString();
        let nextReason: string | null = list[idx]!.designerReturnReason ?? null;
        if (needsDesignerReturnReason(from, to)) {
          nextReason = designerReturnReason!.trim();
        } else if (
          from === "designer_em_producao" &&
          to === "aguardando_aprovacao"
        ) {
          nextReason = null;
        }
        const next = list.map((c) =>
          c.id === cardId
            ? {
                ...c,
                columnId: to,
                updatedAt: now,
                designerReturnReason: nextReason,
              }
            : c
        );
        saveDemoCards(next);
        queryClient.setQueryData<Bootstrap>(["kanban", "cards"], {
          cards: next,
        });
        return {};
      }

      const body: Record<string, unknown> = { columnId: to };
      if (needsDesignerReturnReason(from, to)) {
        body.designerReturnReason = designerReturnReason!.trim();
      }

      const r = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        return { error: j.error ?? "Falha ao mover solicitação." };
      }
      const bodyJson = (await r.json()) as { card: Card };
      queryClient.setQueryData(["kanban", "cards"], (old: Bootstrap | undefined) => {
        if (!old) return old;
        return {
          cards: old.cards.map((c) => (c.id === cardId ? bodyJson.card : c)),
        };
      });
      return {};
    },
    [demo, queryClient]
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
      if (demo) {
        const list = loadDemoCards();
        const idx = list.findIndex((c) => c.id === cardId);
        if (idx === -1) return { error: "Solicitação não encontrada." };
        const now = new Date().toISOString();
        const prev = list[idx]!;
        const nextCard = { ...prev, ...patch, updatedAt: now } as Card;
        const next = [...list];
        next[idx] = nextCard;
        saveDemoCards(next);
        queryClient.setQueryData<Bootstrap>(["kanban", "cards"], {
          cards: next,
        });
        return {};
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
    [currentUser?.role, demo, queryClient]
  );

  const createCardFromForm = useCallback(
    async (form: HTMLFormElement) => {
      if (!demo) {
        return {
          error: "Esta criação rápida só funciona no modo demonstração.",
        };
      }
      try {
        const card = await buildDemoCardFromFormData(form);
        const prev = loadDemoCards();
        const next = [card, ...prev];
        saveDemoCards(next);
        queryClient.setQueryData<Bootstrap>(["kanban", "cards"], {
          cards: next,
        });
        return {};
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro ao criar.";
        return { error: msg };
      }
    },
    [queryClient, demo]
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
      createCardFromForm,
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
      createCardFromForm,
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
