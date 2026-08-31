import { SIGNED_URL_TTL } from "@/shared/lib/constants";
import { createClient } from "@/shared/lib/supabase/server";

export async function createFileUrl(
  path: string,
  expiresIn: number = SIGNED_URL_TTL
): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("patient-documents")
    .createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

export async function deleteFile(
  path: string
): Promise<{ error: Error | null }> {
  const supabase = await createClient();
  const { error } = await supabase.storage
    .from("patient-documents")
    .remove([path]);
  return { error };
}
