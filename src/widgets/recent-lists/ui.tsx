import Link from "next/link";
import { Eye, FileText, UserRound } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { faDate } from "@/shared/lib/jalali";
import type { Patient } from "@/entities/patient/model";
import type { ExaminationWithPatient } from "@/entities/examination/model";

export function RecentPatientsList({ patients }: { patients: Patient[] }) {
  if (patients.length === 0) {
    return (
      <EmptyState
        icon={UserRound}
        title="هنوز بیماری ثبت نشده است"
        description="اولین بیمار را با دکمه «بیمار جدید» ثبت کنید."
        action={
          <Button asChild size="sm" variant="outline">
            <Link href="/patients/new">ثبت بیمار جدید</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="divide-y overflow-hidden rounded-xl border">
      {patients.map((p) => (
        <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
            {p.first_name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {p.first_name} {p.last_name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              کد ملی: <span dir="ltr">{p.national_id ?? "—"}</span>
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/patients/${p.id}`}>
              <Eye className="size-4" />
              پرونده
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}

export function RecentExamsList({ exams }: { exams: ExaminationWithPatient[] }) {
  if (exams.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="هنوز معاینه‌ای ثبت نشده است"
        description="از پروفایل بیمار، اولین معاینه را ثبت کنید."
      />
    );
  }

  return (
    <div className="divide-y overflow-hidden rounded-xl border">
      {exams.map((e) => (
        <div key={e.id} className="flex items-center gap-3 px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {e.patient ? `${e.patient.first_name} ${e.patient.last_name}` : "بیمار"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {faDate(e.exam_date, true)}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/examinations/${e.id}`}>
              <Eye className="size-4" />
              مشاهده
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}