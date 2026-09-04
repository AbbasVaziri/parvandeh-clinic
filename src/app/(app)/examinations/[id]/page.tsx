import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronRight, Glasses, Pencil } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ExamDataView } from "@/entities/examination/ui/exam-view";
import { getExaminationById } from "@/entities/examination/api";
import { getPatientById } from "@/entities/patient/api";
import { faDate } from "@/shared/lib/jalali";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const exam = await getExaminationById(id);
  return { title: exam ? `معاینه ${faDate(exam.exam_date, true)}` : "معاینه" };
}

export default async function ExaminationPage({ params }: PageProps) {
  const { id } = await params;
  const exam = await getExaminationById(id);
  if (!exam) notFound();

  const patient = await getPatientById(exam.patient_id);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ms-2 text-muted-foreground">
        <Link href={`/patients/${exam.patient_id}?tab=exams`}>
          <ChevronRight className="size-4" />
          پرونده {patient ? `${patient.first_name} ${patient.last_name}` : "بیمار"}
        </Link>
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-lg font-bold md:text-xl">معاینه</h1>
          <Badge variant="secondary" className="gap-1.5">
            <CalendarDays className="size-3.5" />
            {faDate(exam.exam_date, true)}
          </Badge>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href={`/patients/${exam.patient_id}/examinations/${exam.id}/edit`}>
              <Pencil className="size-4" />
              ویرایش معاینه
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/patients/${exam.patient_id}/examinations/new`}>
              <Glasses className="size-4" />
              معاینه جدید برای این بیمار
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <ExamDataView data={exam.data} notes={exam.notes} />
      </div>
    </div>
  );
}
