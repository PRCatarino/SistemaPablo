import { auth } from "@/auth";
import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { uploadsFilesystemPath } from "@/lib/uploads";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ segments?: string[] }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { segments } = await ctx.params;
  if (!segments?.length || segments[0] !== "cards") {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const rel = segments.slice(1);
  if (rel.length < 3) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const abs = uploadsFilesystemPath(rel);
  if (!abs) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  try {
    const buf = await readFile(abs);
    const ext = path.extname(abs).toLowerCase();
    const type = MIME[ext] ?? "application/octet-stream";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
}
