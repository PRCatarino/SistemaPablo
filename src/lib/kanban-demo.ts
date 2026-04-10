import type { Card, ColumnId } from "@/lib/kanban-types";
import { COLUMN_ORDER } from "@/lib/kanban-types";

/** Ative na Vercel sem Postgres: `NEXT_PUBLIC_KANBAN_DEMO=true`. Desligue para voltar ao Prisma. */
export function isKanbanDemo(): boolean {
  return (
    process.env.NEXT_PUBLIC_KANBAN_DEMO === "true" ||
    process.env.NEXT_PUBLIC_KANBAN_DEMO === "1"
  );
}

const STORAGE_KEY = "artflow-kanban-demo-v1";

const COLUMN_SET = new Set<string>(COLUMN_ORDER);

function isCardLike(x: unknown): x is Card {
  if (x === null || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.columnId === "string" &&
    COLUMN_SET.has(o.columnId) &&
    typeof o.clientName === "string" &&
    typeof o.clientPhone === "string" &&
    typeof o.requestDate === "string"
  );
}

export function loadDemoCards(): Card[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed.filter(isCardLike) as Card[]).map((c) => ({
      ...c,
      designerReturnReason: c.designerReturnReason ?? null,
    }));
  } catch {
    return [];
  }
}

export function saveDemoCards(cards: Card[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch {
    // quota exceeded — falha silenciosa na demo
  }
}

const MAX_DEMO_FILE_BYTES = 400 * 1024;
const MAX_DEMO_FILES_TOTAL = 8;

async function fileToDataUrl(file: File): Promise<string | null> {
  if (!file.size || !file.type.startsWith("image/")) return null;
  if (file.size > MAX_DEMO_FILE_BYTES) return null;
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(typeof r.result === "string" ? r.result : null);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

async function filesFromFormData(
  formData: FormData,
  fieldName: string,
  budget: { remaining: number }
): Promise<string[]> {
  const files = formData
    .getAll(fieldName)
    .filter((f): f is File => f instanceof File && f.size > 0);
  const out: string[] = [];
  for (const f of files) {
    if (budget.remaining <= 0) break;
    const url = await fileToDataUrl(f);
    if (url) {
      out.push(url);
      budget.remaining -= 1;
    }
  }
  return out;
}

export async function buildDemoCardFromFormData(
  form: HTMLFormElement
): Promise<Card> {
  const fd = new FormData(form);
  const get = (k: string) => {
    const v = fd.get(k);
    return v == null ? "" : String(v).trim();
  };
  const clientName = get("clientName");
  const clientPhone = get("clientPhone");
  if (!clientName || !clientPhone) {
    throw new Error("Nome e telefone são obrigatórios.");
  }

  const budget = { remaining: MAX_DEMO_FILES_TOTAL };
  const attachmentsCliente = await filesFromFormData(
    fd,
    "attachmentsCliente",
    budget
  );
  const attachmentsReferencias = await filesFromFormData(
    fd,
    "attachmentsReferencias",
    budget
  );

  const opt = (k: string): string | null => {
    const v = get(k);
    return v === "" ? null : v;
  };

  const now = new Date().toISOString();
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? `demo_${crypto.randomUUID()}`
      : `demo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  return {
    id,
    columnId: "nova_solicitacao" as ColumnId,
    clientName,
    clientPhone,
    requestDate: now,
    briefingModelagem: opt("briefingModelagem"),
    briefingCor: opt("briefingCor"),
    briefingFrente: opt("briefingFrente"),
    briefingCosta: opt("briefingCosta"),
    briefingPeitoDireito: opt("briefingPeitoDireito"),
    briefingPeitoEsquerdo: opt("briefingPeitoEsquerdo"),
    briefingMangaDireita: opt("briefingMangaDireita"),
    briefingMangaEsquerda: opt("briefingMangaEsquerda"),
    briefingEscrita: opt("briefingEscrita"),
    attachmentsCliente,
    attachmentsReferencias,
    designerReturnReason: null,
    createdAt: now,
    updatedAt: now,
  };
}
