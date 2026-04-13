import { auth } from "@/auth";
import { NextResponse } from "next/server";

/** Anexos não são servidos a partir de disco neste deploy (serverless). */
export async function GET(
  _req: Request,
  _ctx: { params: Promise<{ segments?: string[] }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return NextResponse.json(
    { error: "Anexos em ficheiro não estão disponíveis neste ambiente." },
    { status: 410 },
  );
}
