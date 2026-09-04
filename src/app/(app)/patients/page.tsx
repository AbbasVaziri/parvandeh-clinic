import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Search, UserRoundPlus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
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
import { listPatientsPaginated } from "@/entities/patient/api";
import { latestExamDates } from "@/entities/examination/api";
import { Pagination } from "@/shared/ui/pagination";

export const metadata: Metadata = { title: "بیماران" };

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function PatientsPage({ searchParams }: PageProps) {
  const { page: rawPage, q: rawQ } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const q = (rawQ ?? "").trim();

  const { patients, total } = await listPatientsPaginated(page, PAGE_SIZE, q);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const lastExams = await latestExamDates(patients.map((p) => p.id));

  const searchSp: Record<string, string> = {};
  if (q) searchSp.q = q;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold md:text-xl">بیماران</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {toPersianDigits(total)} بیمار ثبت‌شده
          </p>
        </div>
        <Button asChild>
          <Link href="/patients/new">
            <UserRoundPlus className="size-4" />
            بیمار جدید
          </Link>
        </Button>
      </div>

      <form method="get" className="relative max-w-sm">
        <Search className="absolute start-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={q}
          placeholder="جستجو: نام، کد ملی یا موبایل…"
          aria-label="جستجوی بیمار"
          className="h-11 ps-10"
        />
      </form>

      {patients.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title={q ? "بیماری یافت نشد" : "هنوز بیماری ثبت نشده است"}
          description={
            q
              ? "عبارت دیگری را امتحان کنید."
              : "اولین پرونده را با دکمه «بیمار جدید» بسازید."
          }
          action={
            q ? undefined : (
              <Button asChild size="sm">
                <Link href="/patients/new">ثبت بیمار جدید</Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">نام و نام خانوادگی</TableHead>
                  <TableHead className="text-center">کد ملی</TableHead>
                  <TableHead className="hidden md:table-cell text-center">موبایل</TableHead>
                  <TableHead className="hidden md:table-cell text-center">آخرین معاینه</TableHead>
                  <TableHead className="w-24 text-center"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-center">
                      {p.first_name} {p.last_name}
                    </TableCell>
                    <TableCell dir="ltr" className="text-center">
                      {p.national_id ?? "—"}
                    </TableCell>
                    <TableCell dir="ltr" className="hidden text-center md:table-cell">
                      {p.mobile}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-center">
                      {lastExams.get(p.id) ? faDate(lastExams.get(p.id)) : "—"}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button asChild variant="ghost" size="sm">
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
          <Pagination
            page={page}
            totalPages={totalPages}
            baseUrl="/patients"
            searchParams={searchSp}
          />
        </>
      )}
    </div>
  );
}