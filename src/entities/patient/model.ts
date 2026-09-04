export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string | null;
  national_id: string | null;
  mobile: string;
  birth_date: string | null;
  address: string | null;
  notes: string | null;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientSearchResult {
  id: string;
  first_name: string;
  last_name: string;
  national_id: string | null;
  mobile: string;
  avatar_path: string | null;
  last_exam_date: string | null;
}

export function patientFullName(p: Pick<Patient, "first_name" | "last_name">): string {
  return `${p.first_name} ${p.last_name}`.trim();
}
