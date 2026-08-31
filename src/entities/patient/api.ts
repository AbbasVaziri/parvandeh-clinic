"use server";

import { createClient } from "@/shared/lib/supabase/server";
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

  const supabase = await createClient();
  const pattern = `%${q}%`;

  const { data, error } = await supabase
    .from("patients")
    .select("id, first_name, last_name, national_id, mobile, avatar_path")
    .or(
      `full_name.ilike."${pattern}",national_id.ilike."${pattern}",mobile.ilike."${pattern}"`
    )
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];

  const ids = data.map((p) => p.id);
  const lastExam = new Map<string, string>();
  if (ids.length > 0) {
    const { data: exams } = await supabase
      .from("examinations")
      .select("patient_id, exam_date")
      .in("patient_id", ids)
      .order("exam_date", { ascending: false });
    for (const e of exams ?? []) {
      if (!lastExam.has(e.patient_id)) lastExam.set(e.patient_id, e.exam_date);
    }
  }

  return data.map((p) => ({
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
  const supabase = await createClient();
  const { data } = await supabase.from("patients").select("*").eq("id", id).maybeSingle();
  return (data as Patient | null) ?? null;
}

export async function listPatients(limit = 100): Promise<Patient[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("patients")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data as Patient[] | null) ?? [];
}

export async function countPatients(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("patients")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

export async function nationalIdExists(
  nationalId: string,
  excludeId?: string
): Promise<boolean> {
  const supabase = await createClient();
  let query = supabase
    .from("patients")
    .select("id")
    .eq("national_id", nationalId)
    .limit(1);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query;
  return Boolean(data && data.length > 0);
}

export async function createPatient(
  values: PatientPayload
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();

  if (await nationalIdExists(values.national_id)) {
    return { error: "بیماری با این کد ملی قبلاً ثبت شده است." };
  }

  const { data, error } = await supabase
    .from("patients")
    .insert(values)
    .select("id")
    .single();

  if (error || !data) return { error: faDbError(error) };
  return { id: data.id };
}

export async function updatePatient(
  id: string,
  values: PatientPayload
): Promise<{ error?: string }> {
  const supabase = await createClient();

  if (await nationalIdExists(values.national_id, id)) {
    return { error: "بیمار دیگری با این کد ملی ثبت شده است." };
  }

  const { error } = await supabase.from("patients").update(values).eq("id", id);
  if (error) return { error: faDbError(error) };
  return {};
}

export async function setPatientAvatar(patientId: string, path: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("patients").update({ avatar_path: path }).eq("id", patientId);
}
