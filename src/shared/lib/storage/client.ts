import { DOCUMENT_BUCKET } from "@/shared/lib/constants";
import { createClient } from "@/shared/lib/supabase/client";

export async function uploadFile(
  path: string,
  file: File | Blob,
  contentType?: string
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(path, file, { contentType });
  return { error };
}
