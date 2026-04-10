"use client";

import { useEffect, useRef, useState } from "react";
import type { Card } from "@/lib/kanban-types";
import {
  COLUMN_LABELS,
  COLUMN_ORDER,
  type ColumnId,
} from "@/lib/kanban-types";
import { needsDesignerReturnReason } from "@/lib/permissions";
import { useKanban } from "@/context/KanbanContext";
import { MaterialIcon } from "@/components/MaterialIcon";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

type BriefKey = keyof Pick<
  Card,
  | "briefingModelagem"
  | "briefingCor"
  | "briefingFrente"
  | "briefingCosta"
  | "briefingPeitoDireito"
  | "briefingPeitoEsquerdo"
  | "briefingMangaDireita"
  | "briefingMangaEsquerda"
  | "briefingEscrita"
>;

const BRIEFING_ROWS: { key: BriefKey; label: string }[] = [
  { key: "briefingModelagem", label: "Modelagem" },
  { key: "briefingCor", label: "Cor" },
  { key: "briefingFrente", label: "Frente" },
  { key: "briefingCosta", label: "Costa" },
  { key: "briefingPeitoDireito", label: "Peito direito" },
  { key: "briefingPeitoEsquerdo", label: "Peito esquerdo" },
  { key: "briefingMangaDireita", label: "Manga direita" },
  { key: "briefingMangaEsquerda", label: "Manga esquerda" },
  { key: "briefingEscrita", label: "Escrita" },
];

type EditDraft = {
  clientName: string;
  clientPhone: string;
  columnId: ColumnId;
  designerReturnReason: string;
} & Record<BriefKey, string>;

function cardToDraft(card: Card): EditDraft {
  const d = {
    clientName: card.clientName,
    clientPhone: card.clientPhone,
    columnId: card.columnId,
    designerReturnReason: card.designerReturnReason ?? "",
  } as EditDraft;
  for (const { key } of BRIEFING_ROWS) {
    d[key] = card[key] ?? "";
  }
  return d;
}

function ImageGrid({
  urls,
  title,
  onPick,
}: {
  urls: string[];
  title: string;
  onPick: (url: string) => void;
}) {
  if (!urls.length) {
    return (
      <p className="text-sm italic text-on-surface-variant">
        Nenhuma imagem anexada.
      </p>
    );
  }
  return (
    <div>
      <h4 className="font-headline text-lg font-bold text-primary">{title}</h4>
      <p className="mb-3 text-xs font-medium text-on-surface-variant">
        {urls.length} {urls.length === 1 ? "arquivo" : "arquivos"}
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {urls.map((src) => (
          <li key={src}>
            <button
              type="button"
              onClick={() => onPick(src)}
              className="group relative aspect-square w-full overflow-hidden rounded-lg bg-surface-container-high"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-primary/40 opacity-0 transition-opacity group-hover:opacity-100">
                <MaterialIcon name="zoom_in" className="text-3xl text-white" />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Props = {
  card: Card;
  open: boolean;
  onClose: () => void;
};

export function CardDetailDialog({ card, open, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const { currentUser, patchCardAdmin } = useKanban();
  const isAdmin = currentUser?.role === "administrador";

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EditDraft>(() => cardToDraft(card));
  const [editError, setEditError] = useState<string | null>(null);
  const [editPending, setEditPending] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
      setLightbox(null);
      setEditing(false);
      setEditError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!editing) setDraft(cardToDraft(card));
  }, [card, editing]);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  function startEdit() {
    setDraft(cardToDraft(card));
    setEditError(null);
    setEditing(true);
  }

  async function saveEdit() {
    setEditError(null);
    const reasonTrim = draft.designerReturnReason.trim();
    const prevReason = (card.designerReturnReason ?? "").trim();

    if (
      draft.columnId !== card.columnId &&
      needsDesignerReturnReason(card.columnId, draft.columnId)
    ) {
      if (!reasonTrim) {
        setEditError(
          "Informe o motivo para devolver ao designer em produção."
        );
        return;
      }
    }

    const patch: Record<string, unknown> = {};
    if (draft.clientName !== card.clientName) {
      patch.clientName = draft.clientName.trim();
    }
    if (draft.clientPhone !== card.clientPhone) {
      patch.clientPhone = draft.clientPhone.trim();
    }

    if (draft.columnId !== card.columnId) {
      patch.columnId = draft.columnId;
      if (needsDesignerReturnReason(card.columnId, draft.columnId)) {
        patch.designerReturnReason = reasonTrim;
      }
    } else if (reasonTrim !== prevReason) {
      patch.designerReturnReason = reasonTrim === "" ? null : reasonTrim;
    }

    for (const { key } of BRIEFING_ROWS) {
      const next = draft[key].trim();
      const prev = (card[key] ?? "").trim();
      if (next !== prev) {
        patch[key] = next === "" ? null : draft[key];
      }
    }

    if (Object.keys(patch).length === 0) {
      setEditing(false);
      return;
    }

    setEditPending(true);
    const res = await patchCardAdmin(card.id, patch);
    setEditPending(false);
    if (res.error) {
      setEditError(res.error);
      return;
    }
    setEditing(false);
  }

  return (
    <>
      <dialog
        ref={ref}
        className={[
          "fixed top-1/2 left-1/2 z-[100] m-0 max-h-[min(92vh,90vh)] w-[min(100vw-1rem,56rem)] max-w-[calc(100vw-1rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border-0 bg-surface-container-lowest p-0 text-on-surface shadow-2xl backdrop:bg-primary/40",
          /* `flex` na base quebrava o display:none nativo — todos os cards apareciam abertos */
          open ? "flex flex-col" : "hidden",
        ].join(" ")}
        onClose={onClose}
        onCancel={onClose}
        onClick={(e) => {
          if (e.target === ref.current) onClose();
        }}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-outline-variant/15 bg-surface-bright px-5 py-4">
          <div className="min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="mb-2 flex items-center gap-2 font-semibold text-on-surface-variant transition-colors hover:text-primary"
            >
              <MaterialIcon name="arrow_back" />
              <span className="font-label text-[0.6875rem] tracking-widest uppercase">
                Fechar e voltar
              </span>
            </button>
            <h2 className="font-headline text-xl font-extrabold tracking-tight text-primary">
              {isAdmin && editing ? (
                <input
                  value={draft.clientName}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, clientName: e.target.value }))
                  }
                  className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-high px-2 py-1 text-xl font-extrabold"
                  disabled={editPending}
                />
              ) : (
                card.clientName
              )}
            </h2>
            <p className="mt-1 text-xs text-on-surface-variant">
              {formatDate(card.requestDate)} ·{" "}
              {COLUMN_LABELS[card.columnId as ColumnId]}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isAdmin && !editing ? (
              <button
                type="button"
                onClick={startEdit}
                className="rounded-lg border border-outline-variant px-3 py-2 font-label text-[10px] font-bold uppercase tracking-wider hover:bg-surface-container-high"
              >
                Editar
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high"
              aria-label="Fechar"
            >
              <MaterialIcon name="close" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm">
          {card.designerReturnReason && !editing ? (
            <div className="mb-4 flex gap-3 rounded-lg border border-error/30 bg-error-container/25 p-4 text-on-surface">
              <MaterialIcon
                name="warning"
                filled
                className="mt-0.5 shrink-0 text-error text-[24px]"
              />
              <div>
                <p className="font-label text-[0.6875rem] font-bold uppercase tracking-wider text-error">
                  Retorno da aprovação — motivo registrado
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {card.designerReturnReason}
                </p>
              </div>
            </div>
          ) : null}

          {isAdmin && editing ? (
            <div className="mb-4 space-y-3 rounded-lg border border-outline-variant/30 bg-surface-container-low p-4">
              <label className="block">
                <span className="font-label text-[0.6875rem] font-semibold uppercase text-on-surface-variant">
                  Coluna (etapa)
                </span>
                <select
                  value={draft.columnId}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      columnId: e.target.value as ColumnId,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border-none bg-surface-container-high px-3 py-2 font-body text-sm"
                >
                  {COLUMN_ORDER.map((id) => (
                    <option key={id} value={id}>
                      {COLUMN_LABELS[id]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="font-label text-[0.6875rem] font-semibold uppercase text-on-surface-variant">
                  Motivo do retorno (alerta no card) — deixe vazio para limpar
                </span>
                <textarea
                  rows={3}
                  value={draft.designerReturnReason}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      designerReturnReason: e.target.value,
                    }))
                  }
                  placeholder="Visível para a equipe no cartão com ícone de alerta."
                  className="mt-1 w-full rounded-lg border-none bg-surface-container-high px-3 py-2 text-sm"
                />
              </label>
              <p className="text-xs text-on-surface-variant">
                Se mover de <strong>Aguardando aprovação</strong> para{" "}
                <strong>Designer em produção</strong>, o motivo é obrigatório.
              </p>
            </div>
          ) : null}

          {editError ? (
            <p className="mb-3 text-sm font-semibold text-error" role="alert">
              {editError}
            </p>
          ) : null}

          {isAdmin && editing ? (
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="font-label text-[0.6875rem] font-semibold uppercase text-on-surface-variant">
                  Telefone
                </span>
                <input
                  value={draft.clientPhone}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, clientPhone: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border-none bg-surface-container-high px-3 py-2 text-sm"
                />
              </label>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="relative overflow-hidden rounded-lg bg-surface-container-lowest p-6 shadow-sm lg:col-span-2">
              <div className="thread-indicator bg-secondary" />
              <h3 className="mb-4 pl-2 font-label text-[0.6875rem] font-semibold tracking-wider text-on-surface-variant uppercase">
                Briefing técnico
              </h3>
              {editing && isAdmin ? (
                <div className="space-y-3 pl-2">
                  {BRIEFING_ROWS.map(({ key, label }) => (
                    <label key={key} className="block">
                      <span className="font-label text-[0.6875rem] font-medium uppercase text-on-surface-variant">
                        {label}
                      </span>
                      <textarea
                        rows={2}
                        value={draft[key]}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, [key]: e.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border-none bg-surface-container-high px-3 py-2 text-sm"
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <dl className="space-y-3 pl-2">
                  {BRIEFING_ROWS.map(({ key, label }) => {
                    const v = card[key];
                    const text =
                      typeof v === "string" && v.trim() ? v : "—";
                    return (
                      <div key={key}>
                        <dt className="font-label text-[0.6875rem] font-medium text-on-surface-variant uppercase">
                          {label}
                        </dt>
                        <dd className="whitespace-pre-wrap text-on-surface">
                          {text}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              )}
            </div>
            <div className="space-y-5 rounded-lg bg-surface-container-low p-6">
              <div>
                <p className="font-label text-[0.6875rem] font-semibold tracking-wider text-on-surface-variant uppercase">
                  Telefone
                </p>
                <p className="font-bold text-primary">
                  {editing && isAdmin ? draft.clientPhone : card.clientPhone}
                </p>
              </div>
              <div>
                <p className="font-label text-[0.6875rem] font-semibold tracking-wider text-on-surface-variant uppercase">
                  Solicitação
                </p>
                <p className="font-bold text-primary">
                  {formatDate(card.requestDate)}
                </p>
              </div>
              <div>
                <p className="font-label text-[0.6875rem] font-semibold tracking-wider text-on-surface-variant uppercase">
                  Etapa
                </p>
                <p className="font-bold text-secondary">
                  {COLUMN_LABELS[card.columnId as ColumnId]}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-8 border-t border-outline-variant/15 pt-8">
            <ImageGrid
              title="Arquivos do cliente"
              urls={card.attachmentsCliente}
              onPick={setLightbox}
            />
            <ImageGrid
              title="Referências do atendente"
              urls={card.attachmentsReferencias}
              onPick={setLightbox}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-outline-variant/15 bg-surface-container px-5 py-4 sm:flex-row sm:justify-end">
          {isAdmin && editing ? (
            <>
              <button
                type="button"
                disabled={editPending}
                onClick={() => {
                  setEditing(false);
                  setEditError(null);
                }}
                className="rounded-lg border border-outline-variant px-4 py-3 font-headline text-sm font-bold uppercase hover:bg-surface-container-high disabled:opacity-50"
              >
                Cancelar edição
              </button>
              <button
                type="button"
                disabled={editPending}
                onClick={() => void saveEdit()}
                className="rounded-lg bg-gradient-to-br from-primary to-primary-container px-4 py-3 font-headline text-sm font-bold tracking-wide text-on-primary uppercase transition-all hover:brightness-110 disabled:opacity-50"
              >
                {editPending ? "Salvando…" : "Salvar alterações"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-gradient-to-br from-primary to-primary-container py-3 font-headline text-sm font-bold tracking-wide text-on-primary uppercase transition-all hover:brightness-110 sm:w-auto sm:min-w-[200px]"
            >
              Fechar
            </button>
          )}
        </div>
      </dialog>

      {lightbox ? (
        <button
          type="button"
          className="fixed inset-0 z-[200] flex cursor-zoom-out items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
          aria-label="Fechar ampliação"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Ampliada"
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </button>
      ) : null}
    </>
  );
}
