"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useKanban } from "@/context/KanbanContext";
import { canCreateCard } from "@/lib/permissions";

export function NewSolicitationModal() {
  const { newCardOpen, setNewCardOpen, currentUser } = useKanban();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!currentUser || !canCreateCard(currentUser.role)) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nova-solicitacao-titulo"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <h2 id="nova-solicitacao-titulo" className="text-lg font-semibold text-slate-900">
            Nova solicitação
          </h2>
          <button
            type="button"
            onClick={() => setNewCardOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 px-5 py-4">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              Dados do cliente
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-slate-600">Nome do cliente *</span>
                <input
                  name="clientName"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Telefone *</span>
                <input
                  name="clientPhone"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              A data da solicitação é registrada automaticamente ao salvar.
            </p>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              Briefing da arte
            </h3>
            <div className="mt-3 grid gap-3">
              {(
                [
                  ["briefingModelagem", "Modelagem"],
                  ["briefingCor", "Cor"],
                  ["briefingFrente", "Frente"],
                  ["briefingCosta", "Costa"],
                  ["briefingPeitoDireito", "Peito direito"],
                  ["briefingPeitoEsquerdo", "Peito esquerdo"],
                  ["briefingMangaDireita", "Manga direita"],
                  ["briefingMangaEsquerda", "Manga esquerda"],
                  ["briefingEscrita", "Escrita (textos e fontes)"],
                ] as const
              ).map(([name, label]) => (
                <label key={name} className="block text-sm">
                  <span className="text-slate-600">{label}</span>
                  <textarea
                    name={name}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              Imagens
            </h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-slate-600">Anexos do cliente</span>
                <input
                  name="attachmentsCliente"
                  type="file"
                  accept="image/*"
                  multiple
                  className="mt-1 w-full text-sm file:mr-2 file:rounded file:border-0 file:bg-sky-100 file:px-3 file:py-1.5"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Referências (atendente)</span>
                <input
                  name="attachmentsReferencias"
                  type="file"
                  accept="image/*"
                  multiple
                  className="mt-1 w-full text-sm file:mr-2 file:rounded file:border-0 file:bg-sky-100 file:px-3 file:py-1.5"
                />
              </label>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              JPG, PNG, WebP etc. Máx. 12 MB por arquivo, até 24 por grupo.
            </p>
          </section>

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setNewCardOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {pending ? "Salvando…" : "Criar na coluna Nova Solicitação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
