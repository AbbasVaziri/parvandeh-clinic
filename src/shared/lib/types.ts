export interface ClinicSettings {
  name: string;
}

export interface CustomSectionConfig {
  id: string;
  label: string;
  rows: string[];
  columns: string[];
}

export interface ExamFormSettings {
  customSections: CustomSectionConfig[];
}
