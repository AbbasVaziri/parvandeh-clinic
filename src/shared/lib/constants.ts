import path from "node:path";

export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

/** Absolute path where uploaded files are stored on the local filesystem. */
export const UPLOADS_DIR =
  process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads");

/** URL prefix used to serve files back through the /api/documents route. */
export const UPLOADS_URL_PREFIX = "/api/documents";

export function isAllowedDocumentType(mime: string): boolean {
  return mime.startsWith("image/") || mime === "application/pdf";
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} کیلوبایت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`;
}
