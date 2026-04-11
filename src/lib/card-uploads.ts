import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { sanitizeExt } from "@/lib/uploads";

/** Bucket no Supabase Storage (criar com `supabase/storage-card-attachments.sql`). */
export const CARD_ATTACHMENTS_BUCKET = "card-attachments";

function supabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
}

function serviceRoleKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim()
  );
}

function isSupabaseStorageConfigured(): boolean {
  return Boolean(supabaseUrl() && serviceRoleKey());
}

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".bin": "application/octet-stream",
};

function contentTypeForExt(ext: string): string {
  return MIME[ext.toLowerCase()] ?? "application/octet-stream";
}

async function saveToSupabase(
  cardId: string,
  subfolder: "cliente" | "referencias",
  files: File[],
): Promise<string[]> {
  const url = supabaseUrl()!;
  const key = serviceRoleKey()!;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const urls: string[] = [];
  for (const file of files) {
    if (!file.size) continue;
    const ext = sanitizeExt(file.name);
    const filename = `${randomUUID()}${ext}`;
    const storagePath = `cards/${cardId}/${subfolder}/${filename}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from(CARD_ATTACHMENTS_BUCKET)
      .upload(storagePath, buf, {
        contentType: contentTypeForExt(ext),
        upsert: false,
      });
    if (error) {
      throw new Error(
        `Supabase Storage: ${error.message}. Confirme o bucket "${CARD_ATTACHMENTS_BUCKET}" e a service role key.`,
      );
    }
    const { data } = supabase.storage
      .from(CARD_ATTACHMENTS_BUCKET)
      .getPublicUrl(storagePath);
    urls.push(data.publicUrl);
  }
  return urls;
}

/**
 * Grava anexos no Supabase Storage (obrigatório em todos os ambientes).
 */
export async function saveCardImages(
  cardId: string,
  subfolder: "cliente" | "referencias",
  files: File[],
): Promise<string[]> {
  if (!isSupabaseStorageConfigured()) {
    throw new Error(
      "Anexos exigem Supabase Storage: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY).",
    );
  }
  return saveToSupabase(cardId, subfolder, files);
}
