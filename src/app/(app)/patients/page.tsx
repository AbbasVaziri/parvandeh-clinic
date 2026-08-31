import type { Metadata } from "next";
import Link from "next/link";
import { Eye, UserRoundPlus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { EmptyState } from "@/shared/ui/empty-state";
import { UserRound } from "lucide-react";
import { faDate } from "@/shared/lib/jalali";
import { toPersianDigits } from "@/shared/lib/persian";
import { PatientSearch } from "@/features/patient-search/ui/patient-search";
import { listPatients } from "@/entities/patient/api";
import { latestExamDates } from "@/entities/examination/api";

export const metadata: Metadata = { title: "بیماران" };

export default async function PatientsPage() {
  const patients = await listPatients(100);
  const lastExams = await latestExamDates(patients.map((p) => p.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold md:text-xl">بیماران</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {toPersianDigits(patients.length)} بیمار ثبت‌شده
          </p>
        </div>
        <Button asChild>
          <Link href="/patients/new">
            <UserRoundPlus className="size-4" />
            بیمار جدید
          </Link>
        </Button>
      </div>

      <PatientSearch variant="compact" />

      {patients.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title="هنوز بیماری ثبت نشده است"
          description="اولین پرونده را با دکمه «بیمار جدید» بسازید."
          action={
            <Button asChild size="sm">
              <Link href="/patients/new">ثبت بیمار جدید</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام و نام خانوادگی</TableHead>
                <TableHead>کد ملی</TableHead>
                <TableHead className="hidden md:table-cell">موبایل</TableHead>
                <TableHead className="hidden md:table-cell">آخرین معاینه</TableHead>
                <TableHead className="w-24 text-end"> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.first_name} {p.last_name}
                  </TableCell>
                  <TableCell dir="ltr" className="text-start">
                    {p.national_id}
                  </TableCell>
                  <TableCell dir="ltr" className="hidden text-start md:table-cell">
                    {p.mobile}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {lastExams.get(p.id) ? faDate(lastExams.get(p.id)) : "—"}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/patients/${p.id}`}>
                        <Eye className="size-4" />
                        پرونده
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
