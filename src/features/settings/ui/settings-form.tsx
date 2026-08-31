"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  updateClinicSettings,
} from "@/entities/settings/api";
import type {
  CustomSectionConfig,
  ExamFormSettings,
} from "@/shared/lib/types";

interface SettingsFormProps {
  clinicName: string;
  examConfig: ExamFormSettings;
}

function splitList(value: string): string[] {
  return value
    .split(/[,،]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function SettingsForm({ clinicName, examConfig }: SettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(clinicName);
  const [sections, setSections] = useState<CustomSectionConfig[]>(
    examConfig.customSections
  );
  const [saving, setSaving] = useState(false);

  function updateSection(id: string, patch: Partial<CustomSectionConfig>) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }

  function addSection() {
    setSections((prev) => [
      ...prev,
      {
        id: `s-${Date.now()}`,
        label: "جدول جدید",
        rows: ["ردیف ۱"],
        columns: ["ستون ۱", "ستون ۲"],
      },
    ]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await updateClinicSettings(name, sections);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("تنظیمات ذخیره شد.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="clinic_name">نام کلینیک</Label>
          <Input
            id="clinic_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="کلینیک چشم‌پزشکی"
          />
          <p className="text-xs text-muted-foreground">
            این نام در نوار بالای برنامه نمایش داده می‌شود.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">جدول‌های تکمیلی فرم معاینه</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              اگر در فرم کاغذی جدولی هست که هنوز مشخص نیست، اینجا به‌صورت قابل
              تنظیم تعریف کنید (ردیف‌ها و ستون‌ها را با ویرگول جدا کنید).
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addSection}>
            <Plus className="size-4" />
            جدول جدید
          </Button>
        </div>

        {sections.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            جدول تکمیلی تعریف نشده است.
          </p>
        ) : (
          <div className="space-y-4">
            {sections.map((s) => (
              <div key={s.id} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{s.label || "جدول"}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="حذف جدول"
                    onClick={() =>
                      setSections((prev) => prev.filter((x) => x.id !== s.id))
                    }
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>عنوان جدول</Label>
                    <Input
                      value={s.label}
                      onChange={(e) => updateSection(s.id, { label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>ردیف‌ها</Label>
                    <Input
                      value={s.rows.join("، ")}
                      onChange={(e) =>
                        updateSection(s.id, { rows: splitList(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>ستون‌ها</Label>
                    <Input
                      value={s.columns.join("، ")}
                      onChange={(e) =>
                        updateSection(s.id, { columns: splitList(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button size="lg" onClick={handleSave} disabled={saving}>
        {saving ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        {saving ? "در حال ذخیره…" : "ذخیره تنظیمات"}
      </Button>
    </div>
  );
}
