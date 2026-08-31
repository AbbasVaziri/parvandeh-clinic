interface DbErrorLike {
  code?: string;
  message?: string;
}

export function faDbError(
  error: DbErrorLike | null | undefined,
  fallback = "خطایی رخ داد. لطفاً دوباره تلاش کنید."
): string {
  if (!error) return fallback;
  const message = error.message ?? "";
  if (error.code === "23505" || message.includes("duplicate key")) {
    return "این مقدار قبلاً ثبت شده است (مقدار تکراری).";
  }
  if (error.code === "23503" || message.includes("foreign key")) {
    return "رکورد مرتبط یافت نشد.";
  }
  if (message.includes("row-level security")) {
    return "دسترسی به این عملیات مجاز نیست.";
  }
  return fallback;
}

export function faAuthError(message: string | undefined): string {
  const m = message ?? "";
  if (m.includes("Invalid login credentials")) return "ایمیل یا رمز عبور نادرست است.";
  if (m.includes("Email not confirmed")) return "ایمیل حساب تأیید نشده است.";
  if (m.includes("Too many requests")) return "تلاش‌های زیاد؛ چند لحظه بعد دوباره امتحان کنید.";
  return "ورود ناموفق بود. لطفاً دوباره تلاش کنید.";
}
