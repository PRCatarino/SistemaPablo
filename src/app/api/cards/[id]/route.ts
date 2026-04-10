import { auth } from "@/auth";
import { isKanbanDemo } from "@/lib/kanban-demo";
import { prisma } from "@/lib/prisma";
import { dbCardToDTO } from "@/lib/mappers";
import { canMoveCard, needsDesignerReturnReason } from "@/lib/permissions";
import { sessionToKanbanUser } from "@/lib/session-user";
import type { ColumnId } from "@/lib/kanban-types";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const columnIdEnum = z.enum([
  "nova_solicitacao",
  "designer_pendente",
  "designer_em_producao",
  "aguardando_aprovacao",
  "aguardando_finalizacao",
  "finalizado",
]);

const briefingOptional = z.union([z.string().max(8000), z.null()]).optional();

const patchSchema = z
  .object({
    columnId: columnIdEnum.optional(),
    designerReturnReason: z.union([z.string().max(2000), z.null()]).optional(),
    clientName: z.string().min(1).max(200).optional(),
    clientPhone: z.string().min(1).max(40).optional(),
    briefingModelagem: briefingOptional,
    briefingCor: briefingOptional,
    briefingFrente: briefingOptional,
    briefingCosta: briefingOptional,
    briefingPeitoDireito: briefingOptional,
    briefingPeitoEsquerdo: briefingOptional,
    briefingMangaDireita: briefingOptional,
    briefingMangaEsquerda: briefingOptional,
    briefingEscrita: briefingOptional,
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "empty",
  });

function emptyBriefingToNull(
  v: string | null | undefined
): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

/** Motivo no banco — aplicado só via $executeRaw para funcionar com Prisma Client antigo (sem o campo no `data`). */
type DesignerReasonPatch =
  | undefined
  | { op: "set"; text: string }
  | { op: "clear" };

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (isKanbanDemo()) {
    return NextResponse.json(
      {
        error:
          "Modo demonstração: arraste as solicitações no navegador (dados no armazenamento local).",
      },
      { status: 503 }
    );
  }

  const session = await auth();
  const me = sessionToKanbanUser(session);
  if (!me) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const data = parsed.data;

  const hasClientOrBriefing =
    data.clientName !== undefined ||
    data.clientPhone !== undefined ||
    data.briefingModelagem !== undefined ||
    data.briefingCor !== undefined ||
    data.briefingFrente !== undefined ||
    data.briefingCosta !== undefined ||
    data.briefingPeitoDireito !== undefined ||
    data.briefingPeitoEsquerdo !== undefined ||
    data.briefingMangaDireita !== undefined ||
    data.briefingMangaEsquerda !== undefined ||
    data.briefingEscrita !== undefined;

  if (hasClientOrBriefing && me.role !== "administrador") {
    return NextResponse.json({ error: "Proibido" }, { status: 403 });
  }

  if (
    data.designerReturnReason !== undefined &&
    data.columnId === undefined &&
    me.role !== "administrador"
  ) {
    return NextResponse.json({ error: "Proibido" }, { status: 403 });
  }

  const row = await prisma.shirtArtCard.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json(
      { error: "Solicitação não encontrada" },
      { status: 404 }
    );
  }

  const from = row.columnId as ColumnId;
  const to = (data.columnId ?? from) as ColumnId;

  if (data.columnId !== undefined && data.columnId !== from) {
    if (!canMoveCard(me.role, from, to)) {
      return NextResponse.json(
        { error: "Sem permissão para esta movimentação" },
        { status: 403 }
      );
    }

    if (needsDesignerReturnReason(from, to)) {
      const reason =
        typeof data.designerReturnReason === "string"
          ? data.designerReturnReason.trim()
          : "";
      if (!reason) {
        return NextResponse.json(
          {
            error:
              "Informe o motivo para devolver a solicitação ao designer em produção.",
          },
          { status: 400 }
        );
      }
    }
  }

  const updateData: Prisma.ShirtArtCardUpdateInput = {};
  let designerReasonPatch: DesignerReasonPatch = undefined;

  if (data.columnId !== undefined && data.columnId !== from) {
    updateData.columnId = to;

    if (needsDesignerReturnReason(from, to)) {
      designerReasonPatch = {
        op: "set",
        text: String(data.designerReturnReason ?? "").trim(),
      };
    } else if (
      from === "designer_em_producao" &&
      to === "aguardando_aprovacao"
    ) {
      designerReasonPatch = { op: "clear" };
    }
  }

  if (me.role === "administrador") {
    if (data.clientName !== undefined) {
      updateData.clientName = data.clientName.trim();
    }
    if (data.clientPhone !== undefined) {
      updateData.clientPhone = data.clientPhone.trim();
    }
    if (data.designerReturnReason !== undefined && data.columnId === undefined) {
      designerReasonPatch =
        data.designerReturnReason === null ||
        String(data.designerReturnReason).trim() === ""
          ? { op: "clear" }
          : { op: "set", text: String(data.designerReturnReason).trim() };
    }
    const briefingKeys = [
      "briefingModelagem",
      "briefingCor",
      "briefingFrente",
      "briefingCosta",
      "briefingPeitoDireito",
      "briefingPeitoEsquerdo",
      "briefingMangaDireita",
      "briefingMangaEsquerda",
      "briefingEscrita",
    ] as const;
    for (const key of briefingKeys) {
      if (data[key] !== undefined) {
        const v = emptyBriefingToNull(data[key]);
        if (v !== undefined) {
          updateData[key] = v;
        }
      }
    }
  }

  const needsPrismaWrite =
    Object.keys(updateData).length > 0 || designerReasonPatch !== undefined;

  if (!needsPrismaWrite) {
    return NextResponse.json({ card: dbCardToDTO(row) });
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.shirtArtCard.update({ where: { id }, data: updateData });
      }
      if (designerReasonPatch?.op === "clear") {
        await tx.$executeRaw`
          UPDATE "shirt_art_cards"
          SET "designer_return_reason" = NULL,
              "updated_at" = CURRENT_TIMESTAMP
          WHERE "id" = ${id}
        `;
      } else if (designerReasonPatch?.op === "set") {
        await tx.$executeRaw`
          UPDATE "shirt_art_cards"
          SET "designer_return_reason" = ${designerReasonPatch.text},
              "updated_at" = CURRENT_TIMESTAMP
          WHERE "id" = ${id}
        `;
      }
    });

    const updated = await prisma.shirtArtCard.findUnique({ where: { id } });
    if (!updated) {
      return NextResponse.json(
        { error: "Solicitação não encontrada após atualizar." },
        { status: 404 }
      );
    }
    const dto = dbCardToDTO(updated);
    const reasonRows = await prisma.$queryRaw<
      Array<{ designer_return_reason: string | null }>
    >`
      SELECT "designer_return_reason" FROM "shirt_art_cards" WHERE "id" = ${id} LIMIT 1
    `;
    const reasonFromDb = reasonRows[0]?.designer_return_reason ?? null;
    return NextResponse.json({
      card: { ...dto, designerReturnReason: reasonFromDb },
    });
  } catch (err) {
    console.error("[PATCH /api/cards/[id]]", err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2022") {
        return NextResponse.json(
          {
            error:
              "Coluna ausente no banco (ex.: designer_return_reason). Rode npm run db:deploy e reinicie o servidor.",
          },
          { status: 503 }
        );
      }
    }
    const message =
      err instanceof Error
        ? err.message
        : "Erro ao atualizar solicitação no banco.";
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? message
            : "Erro interno ao atualizar solicitação.",
      },
      { status: 500 }
    );
  }
}
