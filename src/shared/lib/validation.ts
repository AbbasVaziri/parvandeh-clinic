import { z } from "zod";
import { isValidNationalId, normalizeMobile, toEnglishDigits } from "./persian";

function requiredText(label: string, max = 100) {
  return z
    .string({ required_error: `${label} الزامی است` })
    .trim()
    .min(1, `${label} الزامی است`)
    .max(max, `${label} حداکثر ${max} کاراکتر`);
}

function optionalText(max = 1000) {
  return z
    .string()
    .max(max, `حداکثر ${max} کاراکتر`)
    .optional()
    .transform((v) => v?.trim() || null);
}

export const patientSchema = z.object({
  first_name: requiredText("نام", 50),
  last_name: requiredText("نام خانوادگی", 50),
  national_id: z
    .string()
    .optional()
    .transform((v) => (v ? toEnglishDigits(v).replace(/\D/g, "") : ""))
    .refine((v) => v === "" || v.length === 10, "کد ملی باید ۱۰ رقم باشد")
    .refine((v) => v === "" || isValidNationalId(v), "کد ملی وارد شده معتبر نیست")
    .transform((v) => (v === "" ? null : v)),
  mobile: z
    .string({ required_error: "شماره موبایل الزامی است" })
    .transform((v) => normalizeMobile(v))
    .refine((v) => /^09\d{9}$/.test(v), "شماره موبایل معتبر نیست (نمونه: ۰۹۱۲۳۴۵۶۷۸۹)"),
  birth_date: z
    .string()
    .optional()
    .transform((v) => v || null),
  address: optionalText(500),
  notes: optionalText(2000),
});

export type PatientFormInput = z.input<typeof patientSchema>;
export type PatientPayload = z.output<typeof patientSchema>;

/* ------------------------------ examination ------------------------------ */

const optionalNumber = (label: string) =>
  z.preprocess((v) => {
    if (v == null || v === "") return null;
    const cleaned = toEnglishDigits(String(v)).replace(/[^\d.+-]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : Number.NaN;
  },
  z
    .number({ required_error: `${label} الزامی است`, invalid_type_error: `${label} باید عدد باشد` })
    .nullable()
    .refine((v) => v === null || Number.isFinite(v), `${label} باید عدد باشد`));

const optionalShortText = z
  .string()
  .max(30, "حداکثر ۳۰ کاراکتر")
  .optional()
  .transform((v) => v?.trim() || null);

export const examFormSchema = z.object({
  exam_date: z.string().min(1, "تاریخ معاینه الزامی است"),
  va: z.object({
    od: z.object({ sc: optionalShortText, cc: optionalShortText }),
    os: z.object({ sc: optionalShortText, cc: optionalShortText }),
  }),
  refractionDry: z.object({
    od: z.object({
      sph: optionalNumber("SPH"),
      cyl: optionalNumber("CYL"),
      axis: optionalNumber("AXIS").refine(
        (v) => v == null || (v >= 0 && v <= 180),
        "محور (AXIS) باید بین ۰ تا ۱۸۰ باشد"
      ),
    }),
    os: z.object({
      sph: optionalNumber("SPH"),
      cyl: optionalNumber("CYL"),
      axis: optionalNumber("AXIS").refine(
        (v) => v == null || (v >= 0 && v <= 180),
        "محور (AXIS) باید بین ۰ تا ۱۸۰ باشد"
      ),
    }),
  }),
  refractionCyclo: z.object({
    od: z.object({
      sph: optionalNumber("SPH"),
      cyl: optionalNumber("CYL"),
      axis: optionalNumber("AXIS").refine(
        (v) => v == null || (v >= 0 && v <= 180),
        "محور (AXIS) باید بین ۰ تا ۱۸۰ باشد"
      ),
    }),
    os: z.object({
      sph: optionalNumber("SPH"),
      cyl: optionalNumber("CYL"),
      axis: optionalNumber("AXIS").refine(
        (v) => v == null || (v >= 0 && v <= 180),
        "محور (AXIS) باید بین ۰ تا ۱۸۰ باشد"
      ),
    }),
  }),
  diagnosis: optionalText(5000),
  plan: optionalText(5000),
  notes: optionalText(5000),
});

export type ExamFormInput = z.input<typeof examFormSchema>;
export type ExamFormPayload = z.output<typeof examFormSchema>;
