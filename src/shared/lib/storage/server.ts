import { unlink } from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR, UPLOADS_URL_PREFIX } from "@/shared/lib/constants";

export async function createFileUrl(
  storagePath: string
): Promise<string | null> {
  if (!storagePath) return null;
  return `${UPLOADS_URL_PREFIX}/${encodePathSegments(storagePath)}`;
}

async function absolutePath(storagePath: string): Promise<string> {
  const abs = path.join(UPLOADS_DIR, storagePath);
  const root = path.resolve(UPLOADS_DIR);
  if (!abs.startsWith(root)) throw new Error("Invalid storage path");
  return abs;
}

export async function deleteFile(
  storagePath: string
): Promise<{ error: Error | null }> {
  try {
    await unlink(await absolutePath(storagePath));
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}

function encodePathSegments(storagePath: string): string {
  return storagePath.split("/").map(encodeURIComponent).join("/");
}
