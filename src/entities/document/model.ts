export interface PatientDocument {
  id: string;
  patient_id: string;
  title: string | null;
  description: string | null;
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
  url?: string | null;
}

export interface NewDocumentMetadata {
  patient_id: string;
  title: string;
  description: string | null;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
}
