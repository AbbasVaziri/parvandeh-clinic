"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { faDbError } from "@/shared/lib/errors";
import {
  DEFAULT_CLINIC_NAME,
  DEFAULT_EXAM_CONFIG,
} from "@/shared/lib/defaults";
import type {
  ClinicSettings,
  CustomSectionConfig,
  ExamFormSettings,
} from "@/shared/lib/types";

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [];
}

export async function getClinicName(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "clinic")
    .maybeSingle();
  const name = (data?.value as ClinicSettings | null)?.name;
  return name?.trim() || DEFAULT_CLINIC_NAME;
}

export async function getExamFormSettings(): Promise<ExamFormSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "exam_form")
    .maybeSingle();

  const raw = data?.value as ExamFormSettings | null;
  if (!raw || !Array.isArray(raw.customSections)) return DEFAULT_EXAM_CONFIG;

  const customSections: CustomSectionConfig[] = raw.customSections.map((s, i) => ({
    id: String(s.id ?? `section-${i}`),
    label: String(s.label ?? "جدول تکمیلی"),
    rows: asStringArray(s.rows),
    columns: asStringArray(s.columns),
  }));

  return { customSections };
}

export async function updateClinicSettings(
  clinicName: string,
  customSections: CustomSectionConfig[]
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const clinic: ClinicSettings = { name: clinicName.trim() || DEFAULT_CLINIC_NAME };
  const examForm: ExamFormSettings = { customSections };

  const { error } = await supabase
    .from("settings")
    .upsert(
      [
        { key: "clinic", value: clinic },
        { key: "exam_form", value: examForm },
      ],
      { onConflict: "key" }
    );

  if (error) return { error: faDbError(error) };
  return {};
}
