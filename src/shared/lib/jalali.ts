import { format } from "date-fns-jalali";
import { toPersianDigits } from "./persian";

/** Format an ISO date string as Persian (Jalali) date, optionally with time. */
export function faDate(
  input: string | Date | null | undefined,
  withTime = false
): string {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "—";
  return toPersianDigits(format(d, withTime ? "yyyy/MM/dd - HH:mm" : "yyyy/MM/dd"));
}
