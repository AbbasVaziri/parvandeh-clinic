"use server";

import { db } from "@/shared/lib/db";
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
  const { rows } = await db.query<{ value: unknown }>(
    "select value from settings where key = $1",
    ["clinic"]
  );
  const name = (rows[0]?.value as ClinicSettings | null)?.name;
  return name?.trim() || DEFAULT_CLINIC_NAME;
}

export async function getExamFormSettings(): Promise<ExamFormSettings> {
  const { rows } = await db.query<{ value: unknown }>(
    "select value from settings where key = $1",
    ["exam_form"]
  );

  const raw = rows[0]?.value as ExamFormSettings | null;
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
  const clinic: ClinicSettings = { name: clinicName.trim() || DEFAULT_CLINIC_NAME };
  const examForm: ExamFormSettings = { customSections };

  try {
    await db.query(
      `insert into settings (key, value, updated_at)
       values ('clinic', $1, now()), ('exam_form', $2, now())
       on conflict (key) do update
         set value = excluded.value, updated_at = now()`,
      [JSON.stringify(clinic), JSON.stringify(examForm)]
    );
    return {};
  } catch (error) {
    return { error: faDbError(error as { code?: string; message?: string }) };
  }
}
