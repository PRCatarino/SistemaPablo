-- Se o schema shirt_art_cards já está correto mas falta a tabela _prisma_migrations
-- (ou faltam linhas), corre só isto no SQL Editor.

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
