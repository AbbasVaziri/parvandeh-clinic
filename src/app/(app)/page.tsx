import type { Metadata } from "next";
import Link from "next/link";
import { FileText, FolderOpen, UserRoundPlus, Users } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { StatCardsSkeleton } from "@/shared/ui/skeletons";
import { toPersianDigits } from "@/shared/lib/persian";
import { PatientSearch } from "@/features/patient-search/ui/patient-search";
import { countPatients } from "@/entities/patient/api";
import {
  countExaminations,
  recentExaminations,
} from "@/entities/examination/api";
import { countDocuments } from "@/entities/document/api";
import { listPatients } from "@/entities/patient/api";
import {
  RecentExamsList,
  RecentPatientsList,
} from "@/widgets/recent-lists/ui";

export const metadata: Metadata = { title: "داشبورد" };

export default async function DashboardPage() {
  const [patientsCount, examsCount, docsCount, recentPatients, recentExams] =
    await Promise.all([
      countPatients(),
      countExaminations(),
      countDocuments(),
      listPatients(5),
      recentExaminations(5),
    ]);

  const stats = [
    { label: "بیماران", value: patientsCount, icon: Users },
    { label: "معاینه‌ها", value: examsCount, icon: FileText },
    { label: "مدارک", value: docsCount, icon: FolderOpen },
  ];

  return (
    <div className="space-y-8">
      {/* hero: search + new patient */}
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold md:text-xl">خوش آمدید 👋</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              برای شروع، بیمار را جستجو کنید یا پرونده جدید بسازید.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link href="/patients/new">
              <UserRoundPlus className="size-5" />
              بیمار جدید
            </Link>
          </Button>
        </div>
        <PatientSearch variant="hero" />
      </section>

      {/* stats */}
      <section className="grid grid-cols-3 gap-3 md:gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm md:p-5"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <s.icon className="size-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground md:text-sm">
                {s.label}
              </p>
              <p className="text-lg font-bold tabular-nums md:text-2xl">
                {toPersianDigits(s.value)}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* recent lists */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">بیماران اخیر</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/patients">همه بیماران</Link>
            </Button>
          </div>
          <RecentPatientsList patients={recentPatients} />
        </div>
        <div className="space-y-3">
          <h2 className="font-semibold">معاینه‌های اخیر</h2>
          <RecentExamsList exams={recentExams} />
        </div>
      </section>
    </div>
  );
}
