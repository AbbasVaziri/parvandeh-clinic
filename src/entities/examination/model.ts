export interface ExamVa {
  sc: string | null;
  cc: string | null;
}

export interface ExamRefraction {
  sph: number | null;
  cyl: number | null;
  axis: number | null;
}

export interface ExamCustomSectionData {
  id: string;
  label: string;
  rows: string[];
  columns: string[];
  cells: Record<string, string | null>;
}

export interface ExamData {
  va: { od: ExamVa; os: ExamVa };
  refractionDry: { od: ExamRefraction; os: ExamRefraction };
  refractionCyclo: { od: ExamRefraction; os: ExamRefraction };
  diagnosis: string | null;
  plan: string | null;
  custom: ExamCustomSectionData[];
}

export interface Examination {
  id: string;
  patient_id: string;
  exam_date: string;
  data: ExamData;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExaminationWithPatient extends Examination {
  patient: { id: string; first_name: string; last_name: string } | null;
}

export function emptyExamData(custom: ExamCustomSectionData[] = []): ExamData {
  const refEye = { sph: null, cyl: null, axis: null };
  return {
    va: {
      od: { sc: null, cc: null },
      os: { sc: null, cc: null },
    },
    refractionDry: { od: { ...refEye }, os: { ...refEye } },
    refractionCyclo: { od: { ...refEye }, os: { ...refEye } },
    diagnosis: null,
    plan: null,
    custom,
  };
}
