import { auth } from "@/auth";
import { saveCardImages } from "@/lib/card-uploads";
import { prisma } from "@/lib/prisma";
import { dbCardToDTO } from "@/lib/mappers";
import { canCreateCard } from "@/lib/permissions";
import { sessionToKanbanUser } from "@/lib/session-user";
import { Prisma } from "@prisma/client";
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

  const rows = await prisma.shirtArtCard.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ cards: rows.map(dbCardToDTO) });
}

export async function POST(req: Request) {
  const session = await auth();
  const me = sessionToKanbanUser(session);
  if (!me || !canCreateCard(me.role)) {
    return NextResponse.json({ error: "Proibido" }, { status: 403 });
  }

  const ct = req.headers.get("content-type") ?? "";
  if (!ct.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Envie o formulário como multipart/form-data." },
      { status: 400 }
    );
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

  try {
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
    } catch (uploadErr) {
      await prisma.shirtArtCard.delete({ where: { id: card.id } }).catch(() => {});
      console.error("[POST /api/cards] upload", uploadErr);
      return NextResponse.json(
        {
          error:
            "Falha ao salvar anexos. Verifique permissões da pasta de uploads ou o espaço em disco.",
        },
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
  } catch (err) {
    console.error("[POST /api/cards]", err);
    return NextResponse.json(
      { error: prismaPostErrorMessage(err) },
      { status: 500 }
    );
  }
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

const vercelDbHint =
  process.env.VERCEL === "1"
    ? " Na Vercel → Settings → Environment Variables: DATABASE_URL = Supabase → Connection pooling → Transaction (porta 6543), com ?pgbouncer=true&sslmode=require (e senha URL-encoded se tiver @ ou #)."
    : "";

function prismaPostErrorMessage(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P1001":
        return `Não foi possível conectar ao banco. Confira DATABASE_URL (pooler Supabase na Vercel, não localhost).${vercelDbHint}`;
      case "P2021":
      case "P2010":
        return "Esquema do banco desatualizado. Rode as migrations (ex.: npm run db:deploy) contra o Postgres do Supabase.";
      case "P2002":
        return "Conflito de registro único no banco.";
      default:
        return `Erro no banco (${err.code}). Tente de novo em instantes.`;
    }
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return `Falha ao iniciar ligação ao banco. Confira DATABASE_URL.${vercelDbHint}`;
  }
  if (process.env.NODE_ENV === "development" && err instanceof Error) {
    return err.message;
  }
  return "Erro interno ao criar solicitação.";
}
