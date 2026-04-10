import type { ShirtArtCard as DbCard } from "@prisma/client";
import type { ColumnId, ShirtArtCardDTO } from "@/lib/kanban-types";

function parseUrls(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((x): x is string => typeof x === "string");
}

export function dbCardToDTO(c: DbCard): ShirtArtCardDTO {
  return {
    id: c.id,
    columnId: c.columnId as ColumnId,
    clientName: c.clientName,
    clientPhone: c.clientPhone,
    requestDate: c.requestDate.toISOString(),
    briefingModelagem: c.briefingModelagem,
    briefingCor: c.briefingCor,
    briefingFrente: c.briefingFrente,
    briefingCosta: c.briefingCosta,
    briefingPeitoDireito: c.briefingPeitoDireito,
    briefingPeitoEsquerdo: c.briefingPeitoEsquerdo,
    briefingMangaDireita: c.briefingMangaDireita,
    briefingMangaEsquerda: c.briefingMangaEsquerda,
    briefingEscrita: c.briefingEscrita,
    attachmentsCliente: parseUrls(c.attachmentsCliente),
    attachmentsReferencias: parseUrls(c.attachmentsReferencias),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}
