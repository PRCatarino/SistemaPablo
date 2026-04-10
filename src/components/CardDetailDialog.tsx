"use client";

import { useEffect, useRef, useState } from "react";
import type { Card } from "@/lib/kanban-types";
import { COLUMN_LABELS, type ColumnId } from "@/lib/kanban-types";

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
      <p className="text-sm text-slate-500 italic">Nenhuma imagem anexada.</p>
    );
  }
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-sky-800">
        {title}
      </h4>
      <ul className="mt-2 flex flex-wrap gap-2">
        {urls.map((src) => (
          <li key={src}>
            <button
              type="button"
              onClick={() => onPick(src)}
              className="block overflow-hidden rounded-lg border border-slate-200 ring-sky-500/40 hover:ring-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="h-24 w-24 object-cover"
              />
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
        className="w-[min(100vw-1.5rem,40rem)] max-h-[min(92vh,44rem)] rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-black/50 open:flex open:flex-col"
        onClose={onClose}
        onClick={(e) => {
          if (e.target === ref.current) onClose();
        }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-base font-semibold leading-snug">
              {card.clientName}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Solicitação: {formatDate(card.requestDate)} ·{" "}
              {COLUMN_LABELS[card.columnId as ColumnId]}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-sm">
          <dl className="space-y-2 border-b border-slate-100 pb-3">
            <div>
              <dt className="text-xs font-medium text-slate-500">Telefone</dt>
              <dd>{card.clientPhone}</dd>
            </div>
          </dl>

          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-sky-700">
            Briefing
          </h3>
          <dl className="mt-2 space-y-2">
            {BRIEFING_ROWS.map(({ key, label }) => {
              const v = card[key];
              const text =
                typeof v === "string" && v.trim() ? v : "—";
              return (
                <div key={key}>
                  <dt className="text-xs font-medium text-slate-500">{label}</dt>
                  <dd className="whitespace-pre-wrap text-slate-800">{text}</dd>
                </div>
              );
            })}
          </dl>

          <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
            <ImageGrid
              title="Anexos do cliente"
              urls={card.attachmentsCliente}
              onPick={setLightbox}
            />
            <ImageGrid
              title="Referências"
              urls={card.attachmentsReferencias}
              onPick={setLightbox}
            />
          </div>
        </div>

        <div className="border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-sky-600 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Fechar
          </button>
        </div>
      </dialog>

      {lightbox ? (
        <button
          type="button"
          className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-black/90 p-4"
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
