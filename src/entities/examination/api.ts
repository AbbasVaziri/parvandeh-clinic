"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { faDbError } from "@/shared/lib/errors";
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("examinations")
    .insert({
      patient_id: input.patient_id,
      exam_date: input.exam_date,
      data: input.data,
      notes: input.notes,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: faDbError(error) };
  return { id: data.id };
}

export async function getExaminationById(id: string): Promise<Examination | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("examinations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Examination | null) ?? null;
}

export async function listExaminationsByPatient(patientId: string): Promise<Examination[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("examinations")
    .select("*")
    .eq("patient_id", patientId)
    .order("exam_date", { ascending: false });
  return (data as Examination[] | null) ?? [];
}

export async function recentExaminations(limit = 6): Promise<ExaminationWithPatient[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("examinations")
    .select("*, patient:patients(id, first_name, last_name)")
    .order("exam_date", { ascending: false })
    .limit(limit);
  return (data as ExaminationWithPatient[] | null) ?? [];
}

export async function countExaminations(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("examinations")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

/** Latest exam date per patient id (for lists/tables). */
export async function latestExamDates(
  patientIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (patientIds.length === 0) return map;
  const supabase = await createClient();
  const { data } = await supabase
    .from("examinations")
    .select("patient_id, exam_date")
    .in("patient_id", patientIds)
    .order("exam_date", { ascending: false });
  for (const row of data ?? []) {
    if (!map.has(row.patient_id)) map.set(row.patient_id, row.exam_date);
  }
  return map;
}
