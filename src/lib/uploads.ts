import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const UPLOAD_ROOT =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

const ALLOWED_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
]);

export function sanitizeExt(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  return ALLOWED_EXT.has(ext) ? ext : ".bin";
}

export async function saveCardImages(
  cardId: string,
  subfolder: "cliente" | "referencias",
  files: File[]
): Promise<string[]> {
  const base = path.join(UPLOAD_ROOT, "cards", cardId, subfolder);
  await mkdir(base, { recursive: true });
  const urls: string[] = [];
  for (const file of files) {
    if (!file.size) continue;
    const ext = sanitizeExt(file.name);
    const filename = `${randomUUID()}${ext}`;
    const full = path.join(base, filename);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(full, buf);
    urls.push(`/api/uploads/cards/${cardId}/${subfolder}/${filename}`);
  }
  return urls;
}

export function uploadsFilesystemPath(segments: string[]): string | null {
  const safe = segments.every(
    (s) => s && !s.includes("..") && !path.isAbsolute(s)
  );
  if (!safe) return null;
  return path.join(UPLOAD_ROOT, "cards", ...segments);
}
