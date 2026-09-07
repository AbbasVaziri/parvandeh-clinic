"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR } from "@/shared/lib/constants";

export async function saveFile(
  storagePath: string,
  data: Uint8Array
): Promise<{ error: Error | null }> {
  try {
    const abs = path.join(UPLOADS_DIR, storagePath);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, data);
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}
