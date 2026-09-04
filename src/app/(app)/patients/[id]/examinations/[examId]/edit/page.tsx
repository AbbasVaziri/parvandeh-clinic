import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ExamForm } from "@/features/exam-create/ui/exam-form";
import { getPatientById } from "@/entities/patient/api";
import { getExaminationById } from "@/entities/examination/api";
import { getExamFormSettings } from "@/entities/settings/api";

interface PageProps {
  params: Promise<{ id: string; examId: string }>;
}

export const metadata: Metadata = { title: "ویرایش معاینه" };

export default async function EditExaminationPage({ params }: PageProps) {
  const { id, examId } = await params;

  const [patient, exam, config] = await Promise.all([
    getPatientById(id),
    getExaminationById(examId),
    getExamFormSettings(),
  ]);

  if (!patient || !exam || exam.patient_id !== id) notFound();

  const patientName = `${patient.first_name} ${patient.last_name}`;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ms-2 text-muted-foreground"
        >
          <Link href={`/patients/${id}?tab=exams`}>
            <ChevronRight className="size-4" />
            پرونده {patientName}
          </Link>
        </Button>
        <h1 className="text-lg font-bold md:text-xl">ویرایش معاینه</h1>
        <p className="text-sm text-muted-foreground">{patientName}</p>
      </div>

      <ExamForm
        mode="edit"
        patientId={id}
        patientName={patientName}
        config={config}
        examId={exam.id}
        initialData={exam.data}
        initialDate={exam.exam_date}
        initialNotes={exam.notes}
      />
    </div>
  );
}