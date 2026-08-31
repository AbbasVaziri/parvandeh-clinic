"use server";

import { createExamination as _create } from "@/entities/examination/api";
import type { ExamData } from "@/entities/examination/model";

export interface CreateExaminationInput {
  patient_id: string;
  exam_date: string; // ISO
  data: ExamData;
  notes: string | null;
}

export async function createExamination(
  input: CreateExaminationInput
): Promise<{ id: string } | { error: string }> {
  return _create(input);
}
