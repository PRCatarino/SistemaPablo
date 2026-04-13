import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { sanitizeExt, UPLOAD_ROOT } from "@/lib/uploads";

/** Prefixo da URL (rota autenticada em `api/uploads`). */
export const CARD_ATTACHMENTS_URL_PREFIX = "/api/uploads";

async function saveToDisk(
  cardId: string,
  subfolder: "cliente" | "referencias",
  files: File[],
): Promise<string[]> {
  const dir = path.join(UPLOAD_ROOT, "cards", cardId, subfolder);
  await fs.mkdir(dir, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    if (!file.size) continue;
    const ext = sanitizeExt(file.name);
    const filename = `${randomUUID()}${ext}`;
    const filePath = path.join(dir, filename);
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buf);
    urls.push(
      `${CARD_ATTACHMENTS_URL_PREFIX}/cards/${cardId}/${subfolder}/${filename}`,
    );
  }
  return urls;
}

/**
 * Grava anexos em disco (`UPLOAD_DIR` ou pasta `uploads/` no projeto — ver `src/lib/uploads.ts`).
 */
export async function saveCardImages(
  cardId: string,
  subfolder: "cliente" | "referencias",
  files: File[],
): Promise<string[]> {
  return saveToDisk(cardId, subfolder, files);
}
