# راه‌اندازی سامانه پرونده بیماران

## ۱) متغیرهای محیطی

فایل `.env.local` را در ریشه پروژه بسازید (الگو: `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # فقط برای اسکریپت‌های seed/migrate
DATABASE_URL=postgresql://...           # اختیاری — برای اجرای خودکار migration
```

## ۲) ساخت جداول و انبار فایل

 یکی از دو راه:

- **خودکار:** اگر `DATABASE_URL` را دارید:

  ```bash
  npm run db:migrate
  ```

- **دستی:** در داشبورد Supabase → **SQL Editor** → کل فایل
  `supabase/migrations/0001_init.sql` را paste کنید و Run بزنید.

این migration شامل: جداول `patients`, `examinations`, `documents`, `profiles`, `settings`، ایندکس‌های جستجو، RLS و باکت خصوصی `patient-documents` است.

## ۳) ساخت دو کاربر (پذیرش و پزشک)

```bash
npm run seed
```

حساب‌های پیش‌فرض:

| کاربر | ایمیل | رمز عبور |
|---|---|---|
| پذیرش | `reception@clinic.local` | `Reception@1234` |
| پزشک | `doctor@clinic.local` | `Doctor@1234` |

⚠️ رمزها را بعد از اولین ورود از پنل Supabase (Authentication → Users) تغییر دهید.

## ۴) اجرای برنامه

```bash
npm run dev      # توسعه
npm run build && npm start   # production
```

سپس `http://localhost:3000` را باز کنید.
