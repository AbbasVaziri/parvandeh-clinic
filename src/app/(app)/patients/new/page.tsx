import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { PatientForm } from "@/features/patient-create-edit/ui/patient-form";

export const metadata: Metadata = { title: "بیمار جدید" };

export default function NewPatientPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ms-2 text-muted-foreground">
          <Link href="/patients">
            <ChevronRight className="size-4" />
            بیماران
          </Link>
        </Button>
        <h1 className="text-lg font-bold md:text-xl">ثبت بیمار جدید</h1>
        <p className="text-sm text-muted-foreground">
          فیلدهای ستاره‌دار الزامی هستند؛ پس از ثبت، به پروفایل بیمار می‌روید.
        </p>
      </div>
      <PatientForm mode="create" />
    </div>
  );
}
