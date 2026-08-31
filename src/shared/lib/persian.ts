const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

export function toEnglishDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (ch) => {
    const fa = FA_DIGITS.indexOf(ch);
    if (fa > -1) return String(fa);
    return String(AR_DIGITS.indexOf(ch));
  });
}

/**
 * Iranian national ID (کد ملی) checksum validation.
 * Format: 10 digits. Purely data validation — no domain logic.
 */
export function isValidNationalId(raw: string): boolean {
  const code = toEnglishDigits(raw).replace(/\D/g, "");
  if (code.length !== 10) return false;
  if (/^(\d)\1{9}$/.test(code)) return false; // e.g. 0000000000

  const check = Number(code[9]);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(code[i]) * (10 - i);
  }
  const remainder = sum % 11;
  return remainder < 2 ? check === remainder : check === 11 - remainder;
}

/** Normalize Iranian mobile numbers to the 09xxxxxxxxx form. */
export function normalizeMobile(raw: string): string {
  let digits = toEnglishDigits(raw).replace(/\D/g, "");
  if (digits.startsWith("0098")) digits = "0" + digits.slice(4);
  else if (digits.startsWith("98") && digits.length === 12) digits = "0" + digits.slice(2);
  else if (digits.length === 10 && digits.startsWith("9")) digits = "0" + digits;
  return digits;
}

export function isValidIranMobile(value: string): boolean {
  return /^09\d{9}$/.test(normalizeMobile(value));
}
