import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { PatientForm } from "@/features/patient-create-edit/ui/patient-form";
import { getPatientById } from "@/entities/patient/api";
import { createFileUrl } from "@/shared/lib/storage/server";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "ویرایش بیمار" };

export default async function EditPatientPage({ params }: PageProps) {
  const { id } = await params;
  const patient = await getPatientById(id);
  if (!patient) notFound();

  const avatarUrl = patient.avatar_path
    ? await createFileUrl(patient.avatar_path)
    : null;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ms-2 text-muted-foreground">
          <Link href={`/patients/${id}`}>
            <ChevronRight className="size-4" />
            پرونده بیمار
          </Link>
        </Button>
        <h1 className="text-lg font-bold md:text-xl">ویرایش بیمار</h1>
        <p className="text-sm text-muted-foreground">
          {patient.first_name} {patient.last_name}
        </p>
      </div>
      <PatientForm mode="edit" patient={patient} avatarUrl={avatarUrl} />
    </div>
  );
}
