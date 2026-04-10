-- Migração para Kanban de artes (substitui modelo anterior)
DROP TABLE IF EXISTS "kanban_cards";
DROP TABLE IF EXISTS "users";

DROP TYPE IF EXISTS "ColumnId";
DROP TYPE IF EXISTS "QuadroId";
DROP TYPE IF EXISTS "Role";

CREATE TYPE "KanbanColumnId" AS ENUM (
  'nova_solicitacao',
  'designer_pendente',
  'designer_em_producao',
  'aguardando_aprovacao',
  'aguardando_finalizacao',
  'finalizado'
);

CREATE TABLE "shirt_art_cards" (
    "id" TEXT NOT NULL,
    "column_id" "KanbanColumnId" NOT NULL,
    "client_name" TEXT NOT NULL,
    "client_phone" TEXT NOT NULL,
    "request_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "briefing_modelagem" TEXT,
    "briefing_cor" TEXT,
    "briefing_frente" TEXT,
    "briefing_costa" TEXT,
    "briefing_peito_direito" TEXT,
    "briefing_peito_esquerdo" TEXT,
    "briefing_manga_direita" TEXT,
    "briefing_manga_esquerda" TEXT,
    "briefing_escrita" TEXT,
    "attachments_cliente" JSONB NOT NULL DEFAULT '[]',
    "attachments_referencias" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shirt_art_cards_pkey" PRIMARY KEY ("id")
);
