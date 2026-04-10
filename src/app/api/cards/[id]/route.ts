import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { dbCardToDTO } from "@/lib/mappers";
import { canMoveCard } from "@/lib/permissions";
import { sessionToKanbanUser } from "@/lib/session-user";
import type { ColumnId } from "@/lib/kanban-types";
import { z } from "zod";
import { NextResponse } from "next/server";

const patchSchema = z.object({
  columnId: z.enum([
    "nova_solicitacao",
    "designer_pendente",
    "designer_em_producao",
    "aguardando_aprovacao",
    "aguardando_finalizacao",
    "finalizado",
  ]),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const me = sessionToKanbanUser(session);
  if (!me) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const row = await prisma.shirtArtCard.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json({ error: "Card não encontrado" }, { status: 404 });
  }

  const from = row.columnId as ColumnId;
  const to = parsed.data.columnId as ColumnId;
  if (!canMoveCard(me.role, from, to)) {
    return NextResponse.json(
      { error: "Sem permissão para esta movimentação" },
      { status: 403 }
    );
  }

  const updated = await prisma.shirtArtCard.update({
    where: { id },
    data: { columnId: to },
  });

  return NextResponse.json({ card: dbCardToDTO(updated) });
}
