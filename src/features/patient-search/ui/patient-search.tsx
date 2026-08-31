"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LoaderCircle, Search, SearchX, UserRoundPlus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { faDate } from "@/shared/lib/jalali";
import { searchPatients } from "@/entities/patient/api";
import type { PatientSearchResult } from "@/entities/patient/model";

interface PatientSearchProps {
  variant?: "hero" | "compact";
}

export function PatientSearch({ variant = "compact" }: PatientSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef = useRef(0);

  const hero = variant === "hero";

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      setSearched(false);
      return;
    }

    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const seq = ++seqRef.current;
      const found = await searchPatients(q);
      if (seqRef.current !== seq) return; // stale response
      setResults(found);
      setSearched(true);
      setLoading(false);
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  return (
    <div className={hero ? "space-y-4" : "space-y-3"}>
      <div className="relative">
        <Search className="absolute start-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجوی بیمار: نام، نام خانوادگی، کد ملی یا شماره موبایل…"
          aria-label="جستجوی بیمار"
          className={
            hero
              ? "h-14 rounded-xl border-2 bg-card ps-11 text-base shadow-sm md:text-lg"
              : "h-11 ps-10"
          }
        />
        {loading ? (
          <LoaderCircle className="absolute end-3.5 top-1/2 size-5 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      {loading && query.trim().length >= 2 ? (
        <div className="flex items-center gap-2 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          در حال جستجو…
        </div>
      ) : null}

      {!loading && searched && results.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-6 text-center">
          <SearchX className="mx-auto mb-2 size-6 text-muted-foreground" />
          <p className="font-medium">بیماری یافت نشد</p>
          <p className="mt-1 text-sm text-muted-foreground">
            عبارت دیگری را امتحان کنید یا بیمار جدید ثبت کنید.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/patients/new">
              <UserRoundPlus className="size-4" />
              ثبت بیمار جدید
            </Link>
          </Button>
        </div>
      ) : null}

      {results.length > 0 ? (
        <ul className="divide-y overflow-hidden rounded-lg border bg-card">
          {results.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {p.first_name} {p.last_name}
                </p>
                <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                  <span>
                    کد ملی: <span dir="ltr">{p.national_id}</span>
                  </span>
                  <span>
                    موبایل: <span dir="ltr">{p.mobile}</span>
                  </span>
                  {p.last_exam_date ? (
                    <span>آخرین معاینه: {faDate(p.last_exam_date)}</span>
                  ) : (
                    <span>بدون معاینه</span>
                  )}
                </p>
              </div>
              <Button asChild size="sm" variant={hero ? "default" : "outline"}>
                <Link href={`/patients/${p.id}`}>مشاهده پرونده</Link>
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
