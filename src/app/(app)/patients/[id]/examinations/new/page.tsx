import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ExamForm } from "@/features/exam-create/ui/exam-form";
import { getPatientById } from "@/entities/patient/api";
import { getExamFormSettings } from "@/entities/settings/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "ثبت معاینه جدید" };

export default async function NewExaminationPage({ params }: PageProps) {
  const { id } = await params;
  const [patient, config] = await Promise.all([
    getPatientById(id),
    getExamFormSettings(),
  ]);
  if (!patient) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ms-2 text-muted-foreground">
          <Link href={`/patients/${id}?tab=exams`}>
            <ChevronRight className="size-4" />
            پرونده بیمار
          </Link>
        </Button>
        <h1 className="text-lg font-bold md:text-xl">ثبت معاینه جدید</h1>
        <p className="text-sm text-muted-foreground">
          {patient.first_name} {patient.last_name}
        </p>
      </div>
      <ExamForm patientId={id} patientName={`${patient.first_name} ${patient.last_name}`} config={config} />
    </div>
  );
}
