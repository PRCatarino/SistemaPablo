"use client";

import { useCallback, useSyncExternalStore } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";

export const THEME_STORAGE_KEY = "artflow-theme";

function subscribe(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onM = () => onStoreChange();
  const onStorage = () => onStoreChange();
  const onTheme = () => onStoreChange();
  mq.addEventListener("change", onM);
  window.addEventListener("storage", onStorage);
  window.addEventListener("artflow-theme", onTheme);
  return () => {
    mq.removeEventListener("change", onM);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("artflow-theme", onTheme);
  };
}

function getSnapshot(): boolean {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot(): boolean {
  return true;
}

type ThemeToggleProps = {
  /** Barra ArtFlow (#002045): hover claro sobre azul */
  variant?: "onBrand" | "default";
  className?: string;
};

export function ThemeToggle({
  variant = "default",
  className = "",
}: ThemeToggleProps) {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event("artflow-theme"));
  }, []);

  const base =
    variant === "onBrand"
      ? "rounded-full p-2 text-white/90 transition-colors hover:bg-white/10 hover:text-white"
      : "rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface";

  return (
    <button
      type="button"
      onClick={toggle}
      className={`${base} ${className}`.trim()}
      aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
      title={dark ? "Tema claro" : "Tema escuro"}
    >
      <MaterialIcon name={dark ? "light_mode" : "dark_mode"} />
    </button>
  );
}
