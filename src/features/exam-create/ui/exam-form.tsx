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
import { PersianDatePicker, isoToDateObject } from "@/shared/ui/persian-date-picker";
import { toEnglishDigits } from "@/shared/lib/persian";
import type { ExamFormSettings } from "@/shared/lib/types";
import {
  type ExamCustomSectionData,
  type ExamData,
} from "@/entities/examination/model";
import { createExamination, updateExamination } from "../api";

interface ExamFormProps {
  patientId: string;
  patientName: string;
  config: ExamFormSettings;
  mode?: "create" | "edit";
  examId?: string;
  initialData?: ExamData | null;
  initialDate?: string | null;
  initialNotes?: string | null;
}

type VaEye = { sc: string; cc: string };
type RefEye = { sph: string; cyl: string; axis: string };

const num = (v: number | null | undefined) => (v == null ? "" : String(v));
const str = (v: string | null | undefined) => v ?? "";

function parseNumber(raw: string): number | null {
  const v = raw.trim();
  if (!v) return null;
  const n = Number(toEnglishDigits(v).replace(/[^\d.+-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function ExamForm({
  patientId,
  config,
  mode = "create",
  examId,
  initialData = null,
  initialDate = null,
  initialNotes = null,
}: ExamFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [today] = useState(() => new DateObject());

  const [examDate, setExamDate] = useState<DateObject | null>(() =>
    initialDate ? isoToDateObject(initialDate) : today,
  );
  const [va, setVa] = useState<{ od: VaEye; os: VaEye }>({
    od: { sc: str(initialData?.va?.od?.sc), cc: str(initialData?.va?.od?.cc) },
    os: { sc: str(initialData?.va?.os?.sc), cc: str(initialData?.va?.os?.cc) },
  });
  const [refractionDry, setRefractionDry] = useState<{ od: RefEye; os: RefEye }>({
    od: {
      sph: num(initialData?.refractionDry?.od?.sph),
      cyl: num(initialData?.refractionDry?.od?.cyl),
      axis: num(initialData?.refractionDry?.od?.axis),
    },
    os: {
      sph: num(initialData?.refractionDry?.os?.sph),
      cyl: num(initialData?.refractionDry?.os?.cyl),
      axis: num(initialData?.refractionDry?.os?.axis),
    },
  });
  const [refractionCyclo, setRefractionCyclo] = useState<{ od: RefEye; os: RefEye }>({
    od: {
      sph: num(initialData?.refractionCyclo?.od?.sph),
      cyl: num(initialData?.refractionCyclo?.od?.cyl),
      axis: num(initialData?.refractionCyclo?.od?.axis),
    },
    os: {
      sph: num(initialData?.refractionCyclo?.os?.sph),
      cyl: num(initialData?.refractionCyclo?.os?.cyl),
      axis: num(initialData?.refractionCyclo?.os?.axis),
    },
  });
  const [sections, setSections] = useState<ExamCustomSectionData[]>(() => {
    const saved = initialData?.custom;
    if (saved && saved.length > 0) {
      return saved.map((s) => ({
        ...s,
        cells: Object.fromEntries(
          Object.entries(s.cells ?? {}).map(([k, v]) => [k, v ?? ""]),
        ),
      }));
    }
    return (config.customSections ?? []).map((s) => ({ ...s, cells: {} }));
  });
  const [diagnosis, setDiagnosis] = useState(str(initialData?.diagnosis));
  const [plan, setPlan] = useState(str(initialData?.plan));
  const [notes, setNotes] = useState(str(initialNotes));

  const setCell = (si: number, r: number, c: number, value: string) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === si ? { ...s, cells: { ...s.cells, [`${r}:${c}`]: value } } : s,
      ),
    );
  };

  function buildExamDateIso(): string | null {
    if (!examDate) return null;
    const d = examDate.toDate();
    // Exams are date-only; store at local midnight.
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!examDate) {
      toast.error("تاریخ معاینه را انتخاب کنید.");
      return;
    }

    for (const eye of [
      refractionDry.od, refractionDry.os,
      refractionCyclo.od, refractionCyclo.os,
    ]) {
      const axis = parseNumber(eye.axis);
      if (axis !== null && (axis < 0 || axis > 180)) {
        toast.error("محور (AXIS) باید بین ۰ تا ۱۸۰ باشد.");
        return;
      }
    }

    const custom: ExamCustomSectionData[] = sections.map((s) => ({
      ...s,
      cells: Object.fromEntries(
        Object.entries(s.cells).map(([k, v]) => [k, v?.trim() || null]),
      ),
    }));

    const data: ExamData = {
      va: {
        od: { sc: va.od.sc.trim() || null, cc: va.od.cc.trim() || null },
        os: { sc: va.os.sc.trim() || null, cc: va.os.cc.trim() || null },
      },
      refractionDry: {
        od: {
          sph: parseNumber(refractionDry.od.sph),
          cyl: parseNumber(refractionDry.od.cyl),
          axis: parseNumber(refractionDry.od.axis),
        },
        os: {
          sph: parseNumber(refractionDry.os.sph),
          cyl: parseNumber(refractionDry.os.cyl),
          axis: parseNumber(refractionDry.os.axis),
        },
      },
      refractionCyclo: {
        od: {
          sph: parseNumber(refractionCyclo.od.sph),
          cyl: parseNumber(refractionCyclo.od.cyl),
          axis: parseNumber(refractionCyclo.od.axis),
        },
        os: {
          sph: parseNumber(refractionCyclo.os.sph),
          cyl: parseNumber(refractionCyclo.os.cyl),
          axis: parseNumber(refractionCyclo.os.axis),
        },
      },
      diagnosis: diagnosis.trim() || null,
      plan: plan.trim() || null,
      custom,
    };

    const iso = buildExamDateIso();
    if (!iso) {
      toast.error("تاریخ معاینه نامعتبر است.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        patient_id: patientId,
        exam_date: iso,
        data,
        notes: notes.trim() || null,
      };
      if (mode === "edit" && examId) {
        const res = await updateExamination(examId, payload);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success("معاینه با موفقیت ویرایش شد.");
      } else {
        const res = await createExamination(payload);
        if ("error" in res && res.error) {
          toast.error(res.error);
          return;
        }
        toast.success("معاینه با موفقیت ثبت شد.");
      }
      router.push(`/patients/${patientId}?tab=exams`);
    } finally {
      setSaving(false);
    }
  }

  const numInput = (
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
  ) => (
    <Input
      dir="ltr"
      inputMode="decimal"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 text-center"
    />
  );

  const vaInput = (
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
  ) => (
    <Input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 text-center"
    />
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* date */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="max-w-sm space-y-2">
          <Label>تاریخ معاینه *</Label>
          <PersianDatePicker
            value={examDate}
            onChange={setExamDate}
            placeholder="انتخاب تاریخ"
          />
        </div>
      </div>

      {/* visual acuity */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">حدت بینایی (V/A)</h2>
        <div className="overflow-hidden rounded-lg border" dir="ltr">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28 text-center">چشم</TableHead>
                <TableHead className="text-center">SC (بدون عینک)</TableHead>
                <TableHead className="text-center">CC (با عینک)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="bg-muted/40 align-middle font-medium text-center">
                  OD — راست
                </TableCell>
                <TableCell className="p-2">
                  {vaInput(
                    va.od.sc,
                    (v) => setVa((s) => ({ ...s, od: { ...s.od, sc: v } })),
                    "مثلاً 6/6",
                  )}
                </TableCell>
                <TableCell className="p-2">
                  {vaInput(
                    va.od.cc,
                    (v) => setVa((s) => ({ ...s, od: { ...s.od, cc: v } })),
                    "مثلاً 6/6",
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/40 align-middle font-medium text-center">
                  OS — چپ
                </TableCell>
                <TableCell className="p-2">
                  {vaInput(
                    va.os.sc,
                    (v) => setVa((s) => ({ ...s, os: { ...s.os, sc: v } })),
                    "مثلاً 6/6",
                  )}
                </TableCell>
                <TableCell className="p-2">
                  {vaInput(
                    va.os.cc,
                    (v) => setVa((s) => ({ ...s, os: { ...s.os, cc: v } })),
                    "مثلاً 6/6",
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* refraction dry */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">رفرکشن Dry</h2>
        <div className="overflow-hidden rounded-lg border" dir="ltr">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28 text-center">چشم</TableHead>
                <TableHead className="text-center">SPH</TableHead>
                <TableHead className="text-center">CYL</TableHead>
                <TableHead className="text-center">AXIS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="bg-muted/40 align-middle font-medium text-center">
                  OD — راست
                </TableCell>
                <TableCell className="p-2">
                  {numInput(
                    refractionDry.od.sph,
                    (v) =>
                      setRefractionDry((s) => ({ ...s, od: { ...s.od, sph: v } })),
                    "-1.25",
                  )}
                </TableCell>
                <TableCell className="p-2">
                  {numInput(
                    refractionDry.od.cyl,
                    (v) =>
                      setRefractionDry((s) => ({ ...s, od: { ...s.od, cyl: v } })),
                    "-0.50",
                  )}
                </TableCell>
                <TableCell className="p-2">
                  {numInput(
                    refractionDry.od.axis,
                    (v) =>
                      setRefractionDry((s) => ({
                        ...s,
                        od: { ...s.od, axis: v },
                      })),
                    "90",
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/40 align-middle font-medium text-center">
                  OS — چپ
                </TableCell>
                <TableCell className="p-2">
                  {numInput(
                    refractionDry.os.sph,
                    (v) =>
                      setRefractionDry((s) => ({ ...s, os: { ...s.os, sph: v } })),
                    "-1.25",
                  )}
                </TableCell>
                <TableCell className="p-2">
                  {numInput(
                    refractionDry.os.cyl,
                    (v) =>
                      setRefractionDry((s) => ({ ...s, os: { ...s.os, cyl: v } })),
                    "-0.50",
                  )}
                </TableCell>
                <TableCell className="p-2">
                  {numInput(
                    refractionDry.os.axis,
                    (v) =>
                      setRefractionDry((s) => ({
                        ...s,
                        os: { ...s.os, axis: v },
                      })),
                    "90",
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* refraction cyclo */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">رفرکشن Cyclo</h2>
        <div className="overflow-hidden rounded-lg border" dir="ltr">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28 text-center">چشم</TableHead>
                <TableHead className="text-center">SPH</TableHead>
                <TableHead className="text-center">CYL</TableHead>
                <TableHead className="text-center">AXIS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="bg-muted/40 align-middle font-medium text-center">
                  OD — راست
                </TableCell>
                <TableCell className="p-2">
                  {numInput(
                    refractionCyclo.od.sph,
                    (v) =>
                      setRefractionCyclo((s) => ({ ...s, od: { ...s.od, sph: v } })),
                    "-1.25",
                  )}
                </TableCell>
                <TableCell className="p-2">
                  {numInput(
                    refractionCyclo.od.cyl,
                    (v) =>
                      setRefractionCyclo((s) => ({ ...s, od: { ...s.od, cyl: v } })),
                    "-0.50",
                  )}
                </TableCell>
                <TableCell className="p-2">
                  {numInput(
                    refractionCyclo.od.axis,
                    (v) =>
                      setRefractionCyclo((s) => ({
                        ...s,
                        od: { ...s.od, axis: v },
                      })),
                    "90",
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/40 align-middle font-medium text-center">
                  OS — چپ
                </TableCell>
                <TableCell className="p-2">
                  {numInput(
                    refractionCyclo.os.sph,
                    (v) =>
                      setRefractionCyclo((s) => ({ ...s, os: { ...s.os, sph: v } })),
                    "-1.25",
                  )}
                </TableCell>
                <TableCell className="p-2">
                  {numInput(
                    refractionCyclo.os.cyl,
                    (v) =>
                      setRefractionCyclo((s) => ({ ...s, os: { ...s.os, cyl: v } })),
                    "-0.50",
                  )}
                </TableCell>
                <TableCell className="p-2">
                  {numInput(
                    refractionCyclo.os.axis,
                    (v) =>
                      setRefractionCyclo((s) => ({
                        ...s,
                        os: { ...s.os, axis: v },
                      })),
                    "90",
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* configurable custom sections */}
      {sections.map((section, si) => (
        <div
          key={section.id}
          className="rounded-xl border bg-card p-5 shadow-sm"
        >
          <h2 className="mb-4 font-semibold">{section.label}</h2>
          <div className="overflow-x-auto rounded-lg border" dir="ltr">
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

      {/* diagnosis */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="exam_diagnosis">تشخیص</Label>
          <Textarea
            id="exam_diagnosis"
            rows={4}
            placeholder="تشخیص پزشک…"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
        </div>
      </div>

      {/* plan */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="exam_plan">پلن</Label>
          <Textarea
            id="exam_plan"
            rows={4}
            placeholder="طرح درمان / پلن…"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
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
          {saving
            ? "در حال ذخیره…"
            : mode === "create"
              ? "ثبت معاینه"
              : "ذخیره تغییرات"}
        </Button>
        <Button type="button" variant="ghost" disabled={saving} asChild>
          <Link href={`/patients/${patientId}`}>انصراف</Link>
        </Button>
      </div>
    </form>
  );
}
