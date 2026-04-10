-- Motivo obrigatório ao devolver de "Aguardando aprovação" para "Designer em produção"
ALTER TABLE "shirt_art_cards" ADD COLUMN "designer_return_reason" TEXT;
