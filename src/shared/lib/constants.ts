export const DOCUMENT_BUCKET = "patient-documents";

export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB
export const SIGNED_URL_TTL = 60 * 60; // 1 hour

export function isAllowedDocumentType(mime: string): boolean {
  return mime.startsWith("image/") || mime === "application/pdf";
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} کیلوبایت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`;
}
