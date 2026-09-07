# راه‌اندازی سامانه پرونده بیماران

یک اپلیکیشن فول‌استک Next.js که از PostgreSQL مستقیم (بدون Supabase) و next-auth استفاده می‌کند.

## ۱) متغیرهای محیطی

فایل `.env.local` را در ریشه پروژه بسازید (الگو: `.env.example`):

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
AUTH_SECRET=<خروجی openssl rand -base64 32>
```

- `AUTH_SECRET` را با دستور `openssl rand -base64 32` بسازید.
- اگر PostgreSQL هاست‌شده است `DATABASE_SSL=true` را هم اضافه کنید.

## ۲) ساخت جداول و کاربران

شروع کنید:

```bash
npm run db:migrate    # اعمال migrations/*.sql — ساخت جداول
npm run seed          # ساخت دو کاربر (پذیرش و پزشک)
```

این migration شامل جداول `users`, `profiles`, `patients`, `examinations`, `documents`, `settings` و ایندکس‌های جستجو است.

## ۳) دو کاربر پیش‌فرض

| کاربر | ایمیل | رمز عبور |
|---|---|---|
| پذیرش | `reception@clinic.local` | `Reception@1234` |
| پزشک | `doctor@clinic.local` | `Doctor@1234` |

برای تغییر رمز، فایل `scripts/seed-users.mjs` را اجرا کنید (یا آموزش استاندارد hashing را دنبال کنید).

## ۴) اجرای برنامه

```bash
npm run dev      # توسعه
npm run build && npm start   # production
```

سپس `http://localhost:3000` را باز کنید.
