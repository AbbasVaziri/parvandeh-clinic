import type { ExamFormSettings } from "./types";

export const DEFAULT_CLINIC_NAME = "کلینیک چشم‌پزشکی";

export const DEFAULT_EXAM_CONFIG: ExamFormSettings = {
  customSections: [
    {
      id: "extra",
      label: "جدول تکمیلی (قابل تنظیم)",
      rows: ["ردیف ۱", "ردیف ۲"],
      columns: ["ستون ۱", "ستون ۲", "ستون ۳"],
    },
  ],
};
