import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { SettingsForm } from "@/features/settings/ui/settings-form";
import { getClinicName, getExamFormSettings } from "@/entities/settings/api";
import { fetchCurrentSession } from "@/features/auth/api";
import { Badge } from "@/shared/ui/badge";

export const metadata: Metadata = { title: "تنظیمات" };

export default async function SettingsPage() {
  const [clinicName, examConfig, session] = await Promise.all([
    getClinicName(),
    getExamFormSettings(),
    fetchCurrentSession(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold md:text-xl">تنظیمات</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          تنظیمات حداقلی برنامه؛ بعداً امکانات بیشتر به همین صفحه اضافه می‌شود.
        </p>
      </div>

      <SettingsForm clinicName={clinicName} examConfig={examConfig} />

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="size-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">حساب کاربری</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground" dir="ltr">
              {session?.user.email ?? "—"}
            </p>
          </div>
          {session?.profile?.role_label ? (
            <Badge variant="secondary">{session.profile.role_label}</Badge>
          ) : null}
        </div>
        <p className="mt-4 text-xs leading-6 text-muted-foreground">
          این سامانه فقط دو کاربر (پذیرش و پزشک) دارد و هر دو به همه اطلاعات دسترسی
          دارند. تغییر رمز عبور حساب کاربری در حال حاضر از طریق اسکریپت seed انجام می‌شود.
        </p>
      </div>
    </div>
  );
}
