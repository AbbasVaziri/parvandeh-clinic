"use server";

import { db } from "@/shared/lib/db";
import { faDbError } from "@/shared/lib/errors";
import { auth } from "@/shared/lib/auth";
import type { ExamData, Examination, ExaminationWithPatient } from "./model";

export interface CreateExaminationInput {
  patient_id: string;
  exam_date: string; // ISO
  data: ExamData;
  notes: string | null;
}

export async function createExamination(
  input: CreateExaminationInput
): Promise<{ id: string } | { error: string }> {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  try {
    const { rows } = await db.query<{ id: string }>(
      `insert into examinations (patient_id, exam_date, data, notes, created_by)
       values ($1, $2, $3, $4, $5)
       returning id`,
      [
        input.patient_id,
        input.exam_date,
        JSON.stringify(input.data),
        input.notes,
        userId,
      ]
    );
    return { id: rows[0].id };
  } catch (error) {
    return { error: faDbError(error as { code?: string; message?: string }) };
  }
}

export async function updateExamination(
  id: string,
  input: CreateExaminationInput
): Promise<{ error?: string }> {
  try {
    await db.query(
      `update examinations
          set exam_date = $1, data = $2, notes = $3
        where id = $4`,
      [input.exam_date, JSON.stringify(input.data), input.notes, id]
    );
    return {};
  } catch (error) {
    return { error: faDbError(error as { code?: string; message?: string }) };
  }
}

export async function getExaminationById(id: string): Promise<Examination | null> {
  const { rows } = await db.query<Examination>(
    "select * from examinations where id = $1",
    [id]
  );
  return rows[0] ?? null;
}

export async function listExaminationsByPatient(patientId: string): Promise<Examination[]> {
  const { rows } = await db.query<Examination>(
    "select * from examinations where patient_id = $1 order by exam_date desc",
    [patientId]
  );
  return rows;
}

export async function recentExaminations(limit = 6): Promise<ExaminationWithPatient[]> {
  const { rows } = await db.query<ExaminationWithPatient>(
    `select e.*,
            row_to_json(p) as patient
       from examinations e
       left join patients p on p.id = e.patient_id
      order by e.exam_date desc
      limit $1`,
    [limit]
  );
  return rows;
}

export async function countExaminations(): Promise<number> {
  const { rows } = await db.query<{ n: string }>(
    "select count(*)::text as n from examinations"
  );
  return Number(rows[0]?.n ?? 0);
}

/** Latest exam date per patient id (for lists/tables). */
export async function latestExamDates(
  patientIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (patientIds.length === 0) return map;

  const { rows } = await db.query<{ patient_id: string; exam_date: string }>(
    `select patient_id, exam_date
       from examinations
      where patient_id = any($1::uuid[])
      order by exam_date desc`,
    [patientIds]
  );
  for (const row of rows) {
    if (!map.has(row.patient_id)) map.set(row.patient_id, row.exam_date);
  }
  return map;
}
