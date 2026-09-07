"use server";

import { db } from "@/shared/lib/db";
import { faDbError } from "@/shared/lib/errors";
import { toEnglishDigits } from "@/shared/lib/persian";
import type { PatientPayload } from "@/shared/lib/validation";
import type { Patient, PatientSearchResult } from "./model";

function sanitizeQuery(raw: string): string {
  return toEnglishDigits(raw)
    .replace(/["(),*]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

export async function searchPatients(rawQuery: string): Promise<PatientSearchResult[]> {
  const q = sanitizeQuery(rawQuery);
  if (q.length < 2) return [];

  const pattern = `%${q}%`;

  const { rows: patients } = await db.query<{
    id: string;
    first_name: string;
    last_name: string;
    national_id: string | null;
    mobile: string;
    avatar_path: string | null;
  }>(
    `select id, first_name, last_name, national_id, mobile, avatar_path
       from patients
      where full_name ilike $1 or national_id ilike $1 or mobile ilike $1
      order by updated_at desc
      limit 20`,
    [pattern]
  );

  if (patients.length === 0) return [];

  const ids = patients.map((p) => p.id);
  const { rows: exams } = await db.query<{ patient_id: string; exam_date: string }>(
    `select patient_id, exam_date
       from examinations
      where patient_id = any($1::uuid[])
      order by exam_date desc`,
    [ids]
  );

  const lastExam = new Map<string, string>();
  for (const e of exams) {
    if (!lastExam.has(e.patient_id)) lastExam.set(e.patient_id, e.exam_date);
  }

  return patients.map((p) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    national_id: p.national_id,
    mobile: p.mobile,
    avatar_path: p.avatar_path,
    last_exam_date: lastExam.get(p.id) ?? null,
  }));
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const { rows } = await db.query<Patient>("select * from patients where id = $1", [id]);
  return rows[0] ?? null;
}

export async function listPatients(limit = 100): Promise<Patient[]> {
  const { rows } = await db.query<Patient>(
    "select * from patients order by updated_at desc limit $1",
    [limit]
  );
  return rows;
}

export async function listPatientsPaginated(
  page: number,
  pageSize: number,
  search?: string,
): Promise<{ patients: Patient[]; total: number }> {
  const from = (page - 1) * pageSize;

  let where = "";
  const params: unknown[] = [];

  if (search && search.length >= 2) {
    const pattern = `%${sanitizeQuery(search)}%`;
    params.push(pattern);
    where = `where full_name ilike $1 or national_id ilike $1 or mobile ilike $1`;
  }

  const { rows } = await db.query<Patient>(
    `select * from patients ${where}
      order by updated_at desc
      limit $${params.length + 1} offset $${params.length + 2}`,
    [...params, pageSize, from]
  );

  const countParams = params.length > 0 ? [params[0]] : [];
  const { rows: countRows } = await db.query<{ n: string }>(
    `select count(*)::text as n from patients ${where}`,
    countParams
  );

  return {
    patients: rows,
    total: Number(countRows[0]?.n ?? 0),
  };
}

export async function countPatients(): Promise<number> {
  const { rows } = await db.query<{ n: string }>(
    "select count(*)::text as n from patients"
  );
  return Number(rows[0]?.n ?? 0);
}

export async function nationalIdExists(
  nationalId: string | null,
  excludeId?: string
): Promise<boolean> {
  if (!nationalId) return false;
  const { rows } = await db.query<{ id: string }>(
    `select id from patients
      where national_id = $1 ${excludeId ? "and id <> $2" : ""}
      limit 1`,
    excludeId ? [nationalId, excludeId] : [nationalId]
  );
  return rows.length > 0;
}

export async function createPatient(
  values: PatientPayload
): Promise<{ id: string } | { error: string }> {
  if (await nationalIdExists(values.national_id)) {
    return { error: "بیماری با این کد ملی قبلاً ثبت شده است." };
  }

  try {
    const { rows } = await db.query<{ id: string }>(
      `insert into patients (first_name, last_name, national_id, mobile, birth_date, address, notes)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning id`,
      [
        values.first_name,
        values.last_name,
        values.national_id || null,
        values.mobile,
        values.birth_date || null,
        values.address || null,
        values.notes || null,
      ]
    );
    return { id: rows[0].id };
  } catch (error) {
    return { error: faDbError(error as { code?: string; message?: string }) };
  }
}

export async function updatePatient(
  id: string,
  values: PatientPayload
): Promise<{ error?: string }> {
  if (await nationalIdExists(values.national_id, id)) {
    return { error: "بیمار دیگری با این کد ملی ثبت شده است." };
  }

  try {
    await db.query(
      `update patients
          set first_name = $1, last_name = $2, national_id = $3, mobile = $4,
              birth_date = $5, address = $6, notes = $7
        where id = $8`,
      [
        values.first_name,
        values.last_name,
        values.national_id || null,
        values.mobile,
        values.birth_date || null,
        values.address || null,
        values.notes || null,
        id,
      ]
    );
    return {};
  } catch (error) {
    return { error: faDbError(error as { code?: string; message?: string }) };
  }
}

export async function setPatientAvatar(patientId: string, path: string): Promise<void> {
  await db.query("update patients set avatar_path = $1 where id = $2", [path, patientId]);
}
