"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { faDbError } from "@/shared/lib/errors";
import {
  createFileUrl,
  deleteFile,
} from "@/shared/lib/storage/server";
import type { NewDocumentMetadata, PatientDocument } from "./model";

export async function listDocumentsByPatient(
  patientId: string
): Promise<PatientDocument[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  const docs = (data as PatientDocument[] | null) ?? [];
  if (docs.length === 0) return docs;

  const withUrls = await Promise.all(
    docs.map(async (doc) => ({
      ...doc,
      url: await createFileUrl(doc.storage_path),
    }))
  );
  return withUrls;
}

export async function addDocumentMetadata(
  values: NewDocumentMetadata
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("documents")
    .insert({ ...values, uploaded_by: user?.id ?? null })
    .select("id")
    .single();

  if (error || !data) return { error: faDbError(error) };
  return { id: data.id };
}

export async function deleteDocument(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (doc?.storage_path) {
    const { error: storageError } = await deleteFile(doc.storage_path);
    // Object may already be gone — still remove the metadata row.
    if (storageError && !storageError.message.includes("not found")) {
      return { error: faDbError(storageError, "حذف فایل از انبار ناموفق بود.") };
    }
  }

  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return { error: faDbError(error) };
  return {};
}

export async function countDocuments(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}
