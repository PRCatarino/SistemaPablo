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
import { sessionToKanbanUser } from "@/lib/session-user";

type Bootstrap = { cards: Card[] };

type KanbanContextValue = {
  status: "loading" | "authenticated" | "unauthenticated";
  currentUser: ReturnType<typeof sessionToKanbanUser>;
  cards: Card[];
  visibleCards: Card[];
  moveCardToColumn: (cardId: string, columnId: ColumnId) => Promise<void>;
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

  const cards = useMemo(() => data?.cards ?? [], [data]);
  const visibleCards = cards;

  const moveCardToColumn = useCallback(
    async (cardId: string, columnId: ColumnId) => {
      if (demo) {
        const list = loadDemoCards();
        const idx = list.findIndex((c) => c.id === cardId);
        if (idx === -1) return;
        const now = new Date().toISOString();
        const next = list.map((c) =>
          c.id === cardId ? { ...c, columnId, updatedAt: now } : c
        );
        saveDemoCards(next);
        queryClient.setQueryData<Bootstrap>(["kanban", "cards"], {
          cards: next,
        });
        return;
      }

      const r = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId }),
      });
      if (!r.ok) return;
      const body = (await r.json()) as { card: Card };
      queryClient.setQueryData(["kanban", "cards"], (old: Bootstrap | undefined) => {
        if (!old) return old;
        return {
          cards: old.cards.map((c) => (c.id === cardId ? body.card : c)),
        };
      });
    },
    [queryClient, demo]
  );

  const createCardFromForm = useCallback(
    async (form: HTMLFormElement) => {
      if (!demo) return { error: "Modo servidor ativo." };
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
