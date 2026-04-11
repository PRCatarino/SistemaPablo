import os from "os";
import path from "path";

/** Só para servir anexos antigos gravados em disco (`/api/uploads/...`). */
export const UPLOAD_ROOT =
  process.env.UPLOAD_DIR ??
  (process.env.VERCEL === "1"
    ? path.join(os.tmpdir(), "artflow-uploads")
    : path.join(process.cwd(), "uploads"));

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

export function uploadsFilesystemPath(segments: string[]): string | null {
  const safe = segments.every(
    (s) => s && !s.includes("..") && !path.isAbsolute(s),
  );
  if (!safe) return null;
  return path.join(UPLOAD_ROOT, "cards", ...segments);
}
