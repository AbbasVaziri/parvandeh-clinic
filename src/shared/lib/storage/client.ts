"use client";

import { saveFile } from "./server-actions";

export async function uploadFile(
  storagePath: string,
  file: File
): Promise<{ error: Error | null }> {
  const data = new Uint8Array(await file.arrayBuffer());
  return saveFile(storagePath, data);
}
