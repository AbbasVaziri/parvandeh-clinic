"use server";

import { db } from "@/shared/lib/db";
import { faDbError } from "@/shared/lib/errors";
import { auth } from "@/shared/lib/auth";
import {
  createFileUrl,
  deleteFile,
} from "@/shared/lib/storage/server";
import type { NewDocumentMetadata, PatientDocument } from "./model";

export async function listDocumentsByPatient(
  patientId: string
): Promise<PatientDocument[]> {
  const { rows } = await db.query<PatientDocument>(
    "select * from documents where patient_id = $1 order by created_at desc",
    [patientId]
  );

  if (rows.length === 0) return rows;

  const withUrls = await Promise.all(
    rows.map(async (doc) => ({
      ...doc,
      url: await createFileUrl(doc.storage_path),
    }))
  );
  return withUrls;
}

export async function addDocumentMetadata(
  values: NewDocumentMetadata
): Promise<{ id: string } | { error: string }> {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  try {
    const { rows } = await db.query<{ id: string }>(
      `insert into documents (patient_id, title, description, storage_path, file_name, mime_type, size_bytes, uploaded_by)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning id`,
      [
        values.patient_id,
        values.title,
        values.description,
        values.storage_path,
        values.file_name,
        values.mime_type,
        values.size_bytes,
        userId,
      ]
    );
    return { id: rows[0].id };
  } catch (error) {
    return { error: faDbError(error as { code?: string; message?: string }) };
  }
}

export async function deleteDocument(id: string): Promise<{ error?: string }> {
  const { rows } = await db.query<{ storage_path: string }>(
    "select storage_path from documents where id = $1",
    [id]
  );

  const storagePath = rows[0]?.storage_path;
  if (storagePath) {
    const { error: storageError } = await deleteFile(storagePath);
    // Object may already be gone — still remove the metadata row.
    if (storageError && !storageError.message.includes("ENOENT")) {
      return { error: faDbError(storageError, "حذف فایل از انبار ناموفق بود.") };
    }
  }

  await db.query("delete from documents where id = $1", [id]);
  return {};
}

export async function countDocuments(): Promise<number> {
  const { rows } = await db.query<{ n: string }>(
    "select count(*)::text as n from documents"
  );
  return Number(rows[0]?.n ?? 0);
}
