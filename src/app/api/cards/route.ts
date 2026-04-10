import { auth } from "@/auth";
import { isKanbanDemo } from "@/lib/kanban-demo";
import { prisma } from "@/lib/prisma";
import { dbCardToDTO } from "@/lib/mappers";
import { canCreateCard } from "@/lib/permissions";
import { sessionToKanbanUser } from "@/lib/session-user";
import { saveCardImages } from "@/lib/uploads";
import { z } from "zod";
import { NextResponse } from "next/server";

const textSchema = z.object({
  clientName: z.string().min(1).max(200),
  clientPhone: z.string().min(1).max(40),
  briefingModelagem: z.string().max(5000).optional(),
  briefingCor: z.string().max(5000).optional(),
  briefingFrente: z.string().max(8000).optional(),
  briefingCosta: z.string().max(8000).optional(),
  briefingPeitoDireito: z.string().max(8000).optional(),
  briefingPeitoEsquerdo: z.string().max(8000).optional(),
  briefingMangaDireita: z.string().max(8000).optional(),
  briefingMangaEsquerda: z.string().max(8000).optional(),
  briefingEscrita: z.string().max(8000).optional(),
});

const MAX_FILES = 24;
const MAX_BYTES = 12 * 1024 * 1024;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (isKanbanDemo()) {
    return NextResponse.json({ cards: [] });
  }

  const rows = await prisma.shirtArtCard.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ cards: rows.map(dbCardToDTO) });
}

export async function POST(req: Request) {
  if (isKanbanDemo()) {
    return NextResponse.json(
      {
        error:
          "Modo demonstração (localStorage). Crie solicitações pelo formulário no app.",
      },
      { status: 503 }
    );
  }

  const session = await auth();
  const me = sessionToKanbanUser(session);
  if (!me || !canCreateCard(me.role)) {
    return NextResponse.json({ error: "Proibido" }, { status: 403 });
  }

  const ct = req.headers.get("content-type") ?? "";
  if (!ct.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Use multipart/form-data" }, { status: 400 });
  }

  const form = await req.formData();
  const raw = {
    clientName: String(form.get("clientName") ?? ""),
    clientPhone: String(form.get("clientPhone") ?? ""),
    briefingModelagem: optionalStr(form, "briefingModelagem"),
    briefingCor: optionalStr(form, "briefingCor"),
    briefingFrente: optionalStr(form, "briefingFrente"),
    briefingCosta: optionalStr(form, "briefingCosta"),
    briefingPeitoDireito: optionalStr(form, "briefingPeitoDireito"),
    briefingPeitoEsquerdo: optionalStr(form, "briefingPeitoEsquerdo"),
    briefingMangaDireita: optionalStr(form, "briefingMangaDireita"),
    briefingMangaEsquerda: optionalStr(form, "briefingMangaEsquerda"),
    briefingEscrita: optionalStr(form, "briefingEscrita"),
  };

  const parsed = textSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const filesCliente = form
    .getAll("attachmentsCliente")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const filesRef = form
    .getAll("attachmentsReferencias")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (filesCliente.length > MAX_FILES || filesRef.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Máximo de ${MAX_FILES} arquivos por grupo` },
      { status: 400 }
    );
  }

  for (const f of [...filesCliente, ...filesRef]) {
    if (f.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Arquivo excede 12 MB" },
        { status: 400 }
      );
    }
  }

  const card = await prisma.shirtArtCard.create({
    data: {
      columnId: "nova_solicitacao",
      clientName: parsed.data.clientName.trim(),
      clientPhone: parsed.data.clientPhone.trim(),
      briefingModelagem: emptyToNull(parsed.data.briefingModelagem),
      briefingCor: emptyToNull(parsed.data.briefingCor),
      briefingFrente: emptyToNull(parsed.data.briefingFrente),
      briefingCosta: emptyToNull(parsed.data.briefingCosta),
      briefingPeitoDireito: emptyToNull(parsed.data.briefingPeitoDireito),
      briefingPeitoEsquerdo: emptyToNull(parsed.data.briefingPeitoEsquerdo),
      briefingMangaDireita: emptyToNull(parsed.data.briefingMangaDireita),
      briefingMangaEsquerda: emptyToNull(parsed.data.briefingMangaEsquerda),
      briefingEscrita: emptyToNull(parsed.data.briefingEscrita),
      attachmentsCliente: [],
      attachmentsReferencias: [],
    },
  });

  let urlsCliente: string[] = [];
  let urlsRef: string[] = [];
  try {
    urlsCliente = await saveCardImages(card.id, "cliente", filesCliente);
    urlsRef = await saveCardImages(card.id, "referencias", filesRef);
  } catch {
    await prisma.shirtArtCard.delete({ where: { id: card.id } });
    return NextResponse.json(
      { error: "Falha ao salvar anexos" },
      { status: 500 }
    );
  }

  const updated = await prisma.shirtArtCard.update({
    where: { id: card.id },
    data: {
      attachmentsCliente: urlsCliente,
      attachmentsReferencias: urlsRef,
    },
  });

  return NextResponse.json({ card: dbCardToDTO(updated) }, { status: 201 });
}

function optionalStr(form: FormData, key: string): string | undefined {
  const v = form.get(key);
  if (v == null) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}

function emptyToNull(s: string | undefined): string | null {
  if (s == null || s.trim() === "") return null;
  return s.trim();
}
