import { auth } from "@/auth";
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

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const rows = await prisma.shirtArtCard.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ cards: rows.map(dbCardToDTO) });
  } catch (err) {
    console.error("[GET /api/cards]", err);
    return NextResponse.json(
      { error: prismaClientErrorMessage(err, "carregar o quadro") },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  const me = sessionToKanbanUser(session);
  if (!me || !canCreateCard(me.role)) {
    return NextResponse.json({ error: "Proibido" }, { status: 403 });
  }

  const ct = req.headers.get("content-type") ?? "";
  const isForm =
    ct.includes("multipart/form-data") ||
    ct.includes("application/x-www-form-urlencoded");
  if (!isForm) {
    return NextResponse.json(
      {
        error:
          "Content-Type inválido. Use application/x-www-form-urlencoded ou multipart/form-data.",
      },
      { status: 400 },
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

    return NextResponse.json({ card: dbCardToDTO(card) }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/cards]", err);
    return NextResponse.json(
      { error: prismaClientErrorMessage(err, "criar solicitação") },
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
    ? " Na Vercel → Settings → Environment Variables: defina DATABASE_URL com a URI do Postgres (pooler, se usar) e senha URL-encoded se tiver @ ou #."
    : "";

function prismaClientErrorMessage(
  err: unknown,
  action: "carregar o quadro" | "criar solicitação",
): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P1001":
        return `Não foi possível conectar ao banco. Confira DATABASE_URL (host, porta, firewall e SSL).${vercelDbHint}`;
      case "P2021":
      case "P2010":
        return "Esquema desatualizado (tabelas ou colunas em falta). Corre `npx prisma migrate deploy` contra o MESMO Postgres definido em DATABASE_URL desta app (na Vercel: Settings → Environment Variables).";
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
  return `Erro interno ao ${action}.`;
}
