"use client";

import { useEffect, useRef, useState } from "react";
import type { Card } from "@/lib/kanban-types";
import { COLUMN_LABELS, type ColumnId } from "@/lib/kanban-types";
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
        {urls.length} arquivo{urls.length !== 1 ? "s" : ""}
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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else {
      el.close();
      setLightbox(null);
    }
  }, [open]);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  return (
    <>
      <dialog
        ref={ref}
        className="w-[min(100vw-1rem,56rem)] max-h-[min(92vh,44rem)] rounded-xl bg-surface-container-lowest p-0 text-on-surface shadow-2xl backdrop:bg-primary/40 open:flex open:flex-col"
        onClose={onClose}
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
              {card.clientName}
            </h2>
            <p className="mt-1 text-xs text-on-surface-variant">
              {formatDate(card.requestDate)} ·{" "}
              {COLUMN_LABELS[card.columnId as ColumnId]}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high"
            aria-label="Fechar"
          >
            <MaterialIcon name="close" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="relative overflow-hidden rounded-lg bg-surface-container-lowest p-6 shadow-sm lg:col-span-2">
              <div className="thread-indicator bg-secondary" />
              <h3 className="mb-4 pl-2 font-label text-[0.6875rem] font-semibold tracking-wider text-on-surface-variant uppercase">
                Technical briefing
              </h3>
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
            </div>
            <div className="space-y-5 rounded-lg bg-surface-container-low p-6">
              <div>
                <p className="font-label text-[0.6875rem] font-semibold tracking-wider text-on-surface-variant uppercase">
                  Telefone
                </p>
                <p className="font-bold text-primary">{card.clientPhone}</p>
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
              title="Referências da indústria"
              urls={card.attachmentsReferencias}
              onPick={setLightbox}
            />
          </div>
        </div>

        <div className="border-t border-outline-variant/15 bg-surface-container px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-gradient-to-br from-primary to-primary-container py-3 font-headline text-sm font-bold tracking-wide text-on-primary uppercase transition-all hover:brightness-110"
          >
            Fechar
          </button>
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
