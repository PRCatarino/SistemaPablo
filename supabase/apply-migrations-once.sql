-- =============================================================================
-- SistemaPablo — aplica o schema + histórico Prisma SEM usar o CLI na tua rede
-- =============================================================================
-- 1) Supabase → SQL Editor → New query
-- 2) Cola este ficheiro inteiro → Run
--
-- ATENÇÃO: só é seguro com base vazia OU se puderes apagar o schema public.
-- Se já tens dados em shirt_art_cards, não corras o bloco DDL (pede backup primeiro).
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Migration: 20260409120000_init
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "Role" AS ENUM ('administrador', 'designer', 'visualizador');
CREATE TYPE "QuadroId" AS ENUM ('design', 'marketing', 'dev');
CREATE TYPE "ColumnId" AS ENUM ('pendente', 'em_producao', 'aguardando_aprovacao', 'concluido');

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "quadro_id" "QuadroId" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "kanban_cards" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "column_id" "ColumnId" NOT NULL,
    "quadro_id" "QuadroId" NOT NULL,
    "assignee_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "kanban_cards_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Migration: 20260410100000_shirt_art_kanban
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Migration: 20260410180000_designer_return_reason
-- ---------------------------------------------------------------------------
ALTER TABLE "shirt_art_cards" ADD COLUMN IF NOT EXISTS "designer_return_reason" TEXT;

-- ---------------------------------------------------------------------------
-- Histórico Prisma (checksums = SHA-256 dos migration.sql com finais de linha LF, como no Git)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMP(3),
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
SELECT '00000001-0000-0000-0000-000000000001', 'fd976d8acd8f4e8411ceef8ac82f6ad7aa22e324a4bae85ac742beda15c7797f', NOW(), '20260409120000_init', NULL, NULL, NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" m WHERE m.migration_name = '20260409120000_init');

INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
SELECT '00000002-0000-0000-0000-000000000002', 'f2dbee2094aaa822a488917f5e7dbb7c3fba94dd97f436092f82ea1bb577a2ac', NOW(), '20260410100000_shirt_art_kanban', NULL, NULL, NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" m WHERE m.migration_name = '20260410100000_shirt_art_kanban');

INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
SELECT '00000003-0000-0000-0000-000000000003', '14e9ef9fc1a0fcc11a96c11c57d1fe4d2b04e56a7568aee91153fabb843b75bf', NOW(), '20260410180000_designer_return_reason', NULL, NULL, NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" m WHERE m.migration_name = '20260410180000_designer_return_reason');

COMMIT;
