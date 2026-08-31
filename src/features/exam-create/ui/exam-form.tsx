"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DateObject from "react-date-object";
import { LoaderCircle, Save } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { PersianDatePicker } from "@/shared/ui/persian-date-picker";
import { toEnglishDigits } from "@/shared/lib/persian";
import type { ExamFormSettings } from "@/shared/lib/types";
import {
  emptyExamData,
  type ExamCustomSectionData,
  type ExamData,
} from "@/entities/examination/model";
import { createExamination } from "../api";

interface ExamFormProps {
  patientId: string;
  patientName: string;
  config: ExamFormSettings;
}

type VaEye = { sc: string; cc: string };
type RefEye = { sph: string; cyl: string; axis: string };

const emptyVa: VaEye = { sc: "", cc: "" };
const emptyRef: RefEye = { sph: "", cyl: "", axis: "" };

function parseNumber(raw: string): number | null {
  const v = raw.trim();
  if (!v) return null;
  const n = Number(toEnglishDigits(v).replace(/[^\d.+-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function ExamForm({ patientId, patientName, config }: ExamFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [today] = useState(() => new DateObject());

  const [examDate, setExamDate] = useState<DateObject | null>(today);
  const [examTime, setExamTime] = useState("");
  const [va, setVa] = useState<{ od: VaEye; os: VaEye }>({ od: emptyVa, os: emptyVa });
  const [refraction, setRefraction] = useState<{ od: RefEye; os: RefEye }>({
    od: emptyRef,
    os: emptyRef,
  });
  const [sections, setSections] = useState<ExamCustomSectionData[]>(() =>
    (config.customSections ?? []).map((s) => ({ ...s, cells: {} }))
  );
  const [notes, setNotes] = useState("");

  const setCell = (si: number, r: number, c: number, value: string) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === si ? { ...s, cells: { ...s.cells, [`${r}:${c}`]: value } } : s
      )
    );
  };

  function buildExamDateIso(): string | null {
    if (!examDate) return null;
    const d = examDate.toDate();
    const m = /^(\d{1,2}):(\d{2})$/.exec(examTime.trim());
    if (m) {
      d.setHours(Number(m[1]), Number(m[2]), 0, 0);
    }
    return d.toISOString();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!examDate) {
      toast.error("تاریخ معاینه را انتخاب کنید.");
      return;
    }

    for (const eye of [refraction.od, refraction.os]) {
      const axis = parseNumber(eye.axis);
      if (axis !== null && (axis < 0 || axis > 180)) {
        toast.error("محور (AXIS) باید بین ۰ تا ۱۸۰ باشد.");
        return;
      }
    }

    const custom: ExamCustomSectionData[] = sections.map((s) => ({
      ...s,
      cells: Object.fromEntries(
        Object.entries(s.cells).map(([k, v]) => [k, v?.trim() || null])
      ),
    }));

    const data: ExamData = {
      va: {
        od: { sc: va.od.sc.trim() || null, cc: va.od.cc.trim() || null },
        os: { sc: va.os.sc.trim() || null, cc: va.os.cc.trim() || null },
      },
      refraction: {
        od: {
          sph: parseNumber(refraction.od.sph),
          cyl: parseNumber(refraction.od.cyl),
          axis: parseNumber(refraction.od.axis),
        },
        os: {
          sph: parseNumber(refraction.os.sph),
          cyl: parseNumber(refraction.os.cyl),
          axis: parseNumber(refraction.os.axis),
        },
      },
      custom,
    };

    const iso = buildExamDateIso();
    if (!iso) {
      toast.error("تاریخ معاینه نامعتبر است.");
      return;
    }

    setSaving(true);
    try {
      const res = await createExamination({
        patient_id: patientId,
        exam_date: iso,
        data,
        notes: notes.trim() || null,
      });
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("معاینه با موفقیت ثبت شد.");
      router.push(`/patients/${patientId}?tab=exams`);
    } finally {
      setSaving(false);
    }
  }

  const numInput = (value: string, onChange: (v: string) => void, placeholder: string) => (
    <Input
      dir="ltr"
      inputMode="decimal"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 text-center"
    />
  );

  const vaInput = (value: string, onChange: (v: string) => void, placeholder: string) => (
    <Input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 text-center"
    />
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* date & time */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>تاریخ معاینه *</Label>
            <PersianDatePicker
              value={examDate}
              onChange={setExamDate}
              placeholder="انتخاب تاریخ"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exam_time">ساعت (اختیاری)</Label>
            <Input
              id="exam_time"
              dir="ltr"
              type="time"
              value={examTime}
              onChange={(e) => setExamTime(e.target.value)}
              className="text-left"
            />
          </div>
        </div>
      </div>

      {/* visual acuity */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">حدت بینایی (V/A)</h2>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">چشم</TableHead>
                <TableHead>SC (بدون عینک)</TableHead>
                <TableHead>CC (با عینک)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="bg-muted/40 align-middle font-medium">
                  OD — راست
                </TableCell>
                <TableCell className="p-2">
                  {vaInput(va.od.sc, (v) => setVa((s) => ({ ...s, od: { ...s.od, sc: v } }), ), "مثلاً 6/6")}
                </TableCell>
                <TableCell className="p-2">
                  {vaInput(va.od.cc, (v) => setVa((s) => ({ ...s, od: { ...s.od, cc: v } })), "مثلاً 6/6")}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/40 align-middle font-medium">
                  OS — چپ
                </TableCell>
                <TableCell className="p-2">
                  {vaInput(va.os.sc, (v) => setVa((s) => ({ ...s, os: { ...s.os, sc: v } })), "مثلاً 6/6")}
                </TableCell>
                <TableCell className="p-2">
                  {vaInput(va.os.cc, (v) => setVa((s) => ({ ...s, os: { ...s.os, cc: v } })), "مثلاً 6/6")}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* refraction */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">رفرکشن / قدر عینک</h2>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">چشم</TableHead>
                <TableHead>SPH</TableHead>
                <TableHead>CYL</TableHead>
                <TableHead>AXIS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="bg-muted/40 align-middle font-medium">
                  OD — راست
                </TableCell>
                <TableCell className="p-2">
                  {numInput(refraction.od.sph, (v) => setRefraction((s) => ({ ...s, od: { ...s.od, sph: v } })), "-1.25")}
                </TableCell>
                <TableCell className="p-2">
                  {numInput(refraction.od.cyl, (v) => setRefraction((s) => ({ ...s, od: { ...s.od, cyl: v } })), "-0.50")}
                </TableCell>
                <TableCell className="p-2">
                  {numInput(refraction.od.axis, (v) => setRefraction((s) => ({ ...s, od: { ...s.od, axis: v } })), "90")}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/40 align-middle font-medium">
                  OS — چپ
                </TableCell>
                <TableCell className="p-2">
                  {numInput(refraction.os.sph, (v) => setRefraction((s) => ({ ...s, os: { ...s.os, sph: v } })), "-1.25")}
                </TableCell>
                <TableCell className="p-2">
                  {numInput(refraction.os.cyl, (v) => setRefraction((s) => ({ ...s, os: { ...s.os, cyl: v } })), "-0.50")}
                </TableCell>
                <TableCell className="p-2">
                  {numInput(refraction.os.axis, (v) => setRefraction((s) => ({ ...s, os: { ...s.os, axis: v } })), "90")}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* configurable custom sections */}
      {sections.map((section, si) => (
        <div key={section.id} className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">{section.label}</h2>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">—</TableHead>
                  {section.columns.map((col) => (
                    <TableHead key={col} className="whitespace-nowrap">
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {section.rows.map((row, r) => (
                  <TableRow key={`${row}-${r}`}>
                    <TableCell className="bg-muted/40 align-middle font-medium whitespace-nowrap">
                      {row}
                    </TableCell>
                    {section.columns.map((_, c) => (
                      <TableCell key={c} className="p-2">
                        <Input
                          value={section.cells[`${r}:${c}`] ?? ""}
                          onChange={(e) => setCell(si, r, c, e.target.value)}
                          className="h-10 text-center"
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}

      {/* notes */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="exam_notes">F — یادداشت / فوندوس</Label>
          <Textarea
            id="exam_notes"
            rows={6}
            placeholder="یادداشت آزاد معاینه…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {saving ? "در حال ذخیره…" : "ثبت معاینه"}
        </Button>
        <Button type="button" variant="ghost" disabled={saving} asChild>
          <Link href={`/patients/${patientId}`}>انصراف</Link>
        </Button>
      </div>
    </form>
  );
}
