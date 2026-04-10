"use client";

import { useEffect, useRef } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** largura máxima tailwind, ex: max-w-md */
  size?: "sm" | "md" | "lg";
};

const sizeClass = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };

export function SimpleDialog({
  open,
  onClose,
  title,
  children,
  size = "md",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="simple-dialog-title"
        className={`w-full ${sizeClass[size]} rounded-xl bg-surface-container-lowest shadow-2xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/15 px-5 py-3">
          <h2
            id="simple-dialog-title"
            className="font-headline text-lg font-bold text-primary"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high"
            aria-label="Fechar"
          >
            <MaterialIcon name="close" />
          </button>
        </div>
        <div className="max-h-[min(70vh,480px)] overflow-y-auto px-5 py-4 text-sm text-on-surface">
          {children}
        </div>
      </div>
    </div>
  );
}
