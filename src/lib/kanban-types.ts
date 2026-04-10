export const COLUMN_ORDER = [
  "nova_solicitacao",
  "designer_pendente",
  "designer_em_producao",
  "aguardando_aprovacao",
  "aguardando_finalizacao",
  "finalizado",
] as const;

export type ColumnId = (typeof COLUMN_ORDER)[number];

export const COLUMN_LABELS: Record<ColumnId, string> = {
  nova_solicitacao: "Nova Solicitação",
  designer_pendente: "Designer Pendente",
  designer_em_producao: "Designer em Produção",
  aguardando_aprovacao: "Aguardando Aprovação",
  aguardando_finalizacao: "Aguardando Finalização",
  finalizado: "Finalizado",
};

export type Role =
  | "administrador"
  | "atendente"
  | "designer"
  | "finalizador";

export const ROLE_LABELS: Record<Role, string> = {
  administrador: "Administrador",
  atendente: "Atendente",
  designer: "Designer",
  finalizador: "Finalizador",
};

export type ShirtArtCardDTO = {
  id: string;
  columnId: ColumnId;
  clientName: string;
  clientPhone: string;
  requestDate: string;
  briefingModelagem: string | null;
  briefingCor: string | null;
  briefingFrente: string | null;
  briefingCosta: string | null;
  briefingPeitoDireito: string | null;
  briefingPeitoEsquerdo: string | null;
  briefingMangaDireita: string | null;
  briefingMangaEsquerda: string | null;
  briefingEscrita: string | null;
  attachmentsCliente: string[];
  attachmentsReferencias: string[];
  /** Preenchido ao devolver da aprovação para produção no designer (exige motivo). */
  designerReturnReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SessionKanbanUser = {
  id: string;
  name: string;
  role: Role;
};

/** Alias para componentes */
export type Card = ShirtArtCardDTO;
