"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useKanban } from "@/context/KanbanContext";
import { canCreateCard } from "@/lib/permissions";
import { MaterialIcon } from "@/components/MaterialIcon";

const BRIEFING_FIELDS = [
  ["briefingModelagem", "Modelagem"],
  ["briefingCor", "Cor"],
  ["briefingFrente", "Frente"],
  ["briefingCosta", "Costa"],
  ["briefingPeitoDireito", "Peito direito"],
  ["briefingPeitoEsquerdo", "Peito esquerdo"],
  ["briefingMangaDireita", "Manga direita"],
  ["briefingMangaEsquerda", "Manga esquerda"],
  ["briefingEscrita", "Escrita (textos e fontes)"],
] as const;

export function NewSolicitationModal() {
  const { newCardOpen, setNewCardOpen, currentUser } = useKanban();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (newCardOpen) setError(null);
  }, [newCardOpen]);

  if (!currentUser || !canCreateCard(currentUser.role)) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    try {
      const fd = new FormData(form);
      const r = await fetch("/api/cards", {
        method: "POST",
        body: fd,
      });
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setError(data.error ?? "Erro ao criar solicitação.");
        setPending(false);
        return;
      }
      form.reset();
      setNewCardOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["kanban", "cards"] });
    } catch {
      setError("Falha de rede.");
    }
    setPending(false);
  }

  if (!newCardOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nova-solicitacao-titulo"
    >
      <div className="relative flex max-h-[min(92vh,921px)] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-2xl">
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

        <header className="z-10 flex shrink-0 items-center justify-between border-b border-outline-variant/15 bg-surface-container-lowest px-6 py-6 sm:px-8">
          <div className="flex items-center gap-4">
            <div className="h-8 w-1.5 rounded-full bg-secondary" />
            <div>
              <h1
                id="nova-solicitacao-titulo"
                className="font-headline text-xl font-extrabold tracking-tight text-primary uppercase sm:text-2xl"
              >
                Nova solicitação
              </h1>
              <p className="font-body text-xs font-medium tracking-widest text-on-surface-variant uppercase">
                Fluxo de criação têxtil
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNewCardOpen(false)}
            className="rounded-full p-2 transition-colors hover:bg-surface-container-high group"
            aria-label="Fechar"
          >
            <MaterialIcon
              name="close"
              className="text-on-surface-variant group-hover:text-primary"
            />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="hide-scrollbar flex-1 space-y-10 overflow-y-auto p-6 sm:p-8">
            <section>
              <div className="mb-6 flex items-center gap-3">
                <MaterialIcon
                  name="person_pin"
                  filled
                  className="text-secondary"
                />
                <h2 className="font-headline font-bold tracking-tight text-primary">
                  Dados do cliente
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-1">
                  <label
                    htmlFor="ns-clientName"
                    className="block font-label text-[0.6875rem] font-semibold tracking-wider text-on-surface-variant uppercase"
                  >
                    Nome completo *
                  </label>
                  <input
                    id="ns-clientName"
                    name="clientName"
                    required
                    placeholder="Ex.: Studio Alessa Têxtil"
                    className="w-full rounded-lg border-none bg-surface-container-high px-4 py-3 text-on-surface transition-all focus:border-b-2 focus:border-secondary focus:ring-0"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="ns-clientPhone"
                    className="block font-label text-[0.6875rem] font-semibold tracking-wider text-on-surface-variant uppercase"
                  >
                    Telefone / WhatsApp *
                  </label>
                  <input
                    id="ns-clientPhone"
                    name="clientPhone"
                    type="tel"
                    required
                    placeholder="+55 (00) 00000-0000"
                    className="w-full rounded-lg border-none bg-surface-container-high px-4 py-3 text-on-surface transition-all focus:border-b-2 focus:border-secondary focus:ring-0"
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-on-surface-variant">
                A data da solicitação é registrada automaticamente ao enviar.
              </p>
            </section>

            <section>
              <div className="mb-6 flex items-center gap-3">
                <MaterialIcon name="palette" filled className="text-secondary" />
                <h2 className="font-headline font-bold tracking-tight text-primary">
                  Briefing da arte
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {BRIEFING_FIELDS.map(([name, label]) => (
                  <label key={name} className="space-y-1">
                    <span className="block font-label text-[0.6875rem] font-semibold tracking-wider text-on-surface-variant uppercase">
                      {label}
                    </span>
                    <textarea
                      name={name}
                      rows={2}
                      className="w-full resize-y rounded-lg border-none bg-surface-container-high px-4 py-3 text-sm text-on-surface transition-all focus:border-b-2 focus:border-secondary focus:ring-0"
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant/25 bg-surface-container-low/80 p-6">
              <div className="mb-2 flex items-center gap-3">
                <MaterialIcon
                  name="info"
                  filled
                  className="text-secondary"
                />
                <h2 className="font-headline font-bold tracking-tight text-primary">
                  Anexos e referências
                </h2>
              </div>
              <p className="font-body text-sm text-on-surface-variant">
                Este ambiente corre na <strong className="text-on-surface">Vercel</strong>{" "}
                (serverless): <strong className="text-on-surface">não há armazenamento de ficheiros</strong>.
                Use os campos de briefing acima para descrever logos, cores e referências em texto.
              </p>
            </section>

            {error ? (
              <div
                className="flex items-center gap-2 rounded-lg border border-error/10 bg-error-container/30 px-3 py-2"
                role="alert"
              >
                <MaterialIcon name="error" filled className="text-error" />
                <p className="font-body text-sm font-semibold text-on-error-container">
                  {error}
                </p>
              </div>
            ) : null}
          </div>

          <footer className="z-10 flex shrink-0 flex-col gap-3 border-t border-outline-variant/15 bg-surface-container px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <button
              type="button"
              onClick={() => setNewCardOpen(false)}
              className="flex items-center justify-center gap-2 font-label text-[0.6875rem] font-bold tracking-widest text-on-surface-variant uppercase transition-colors hover:text-primary sm:justify-start"
            >
              <MaterialIcon name="close" className="text-sm" />
              Cancelar
            </button>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-2 bg-gradient-to-br from-primary to-primary-container px-8 py-3 font-headline text-xs font-extrabold tracking-[0.15em] text-white uppercase shadow-lg shadow-primary/20 transition-all hover:brightness-125 disabled:opacity-60 sm:px-10"
              >
                {pending ? "Enviando…" : "Enviar solicitação"}
                <MaterialIcon name="send" className="text-sm" />
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
