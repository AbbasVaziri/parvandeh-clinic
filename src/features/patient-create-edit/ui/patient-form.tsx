"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Camera, ImagePlus, LoaderCircle, Save } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import {
  PersianDatePicker,
  dateObjectToIso,
  isoToDateObject,
} from "@/shared/ui/persian-date-picker";
import { patientSchema } from "@/shared/lib/validation";
import type {
  PatientFormInput,
  PatientPayload,
} from "@/shared/lib/validation";
import { MAX_AVATAR_SIZE } from "@/shared/lib/constants";
import { uploadFile } from "@/shared/lib/storage/client";
import { createPatient, updatePatient, setPatientAvatar } from "../api";
import type { Patient } from "@/entities/patient/model";

interface PatientFormProps {
  mode: "create" | "edit";
  patient?: Patient;
  avatarUrl?: string | null;
}

export function PatientForm({ mode, patient, avatarUrl }: PatientFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PatientFormInput, unknown, PatientPayload>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      first_name: patient?.first_name ?? "",
      last_name: patient?.last_name ?? "",
      national_id: patient?.national_id ?? "",
      mobile: patient?.mobile ?? "",
      birth_date: patient?.birth_date ?? "",
      address: patient?.address ?? "",
      notes: patient?.notes ?? "",
    },
  });

  const birthIso = form.watch("birth_date");

  function pickAvatar(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("عکس پروفایل باید یک تصویر باشد.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("حجم عکس حداکثر ۵ مگابایت است.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function uploadAvatar(patientId: string, file: File) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `patients/${patientId}/avatar-${Date.now()}.${ext}`;
    const { error } = await uploadFile(path, file);
    if (error) {
      toast.error("بارگذاری عکس پروفایل ناموفق بود.");
      return;
    }
    await setPatientAvatar(patientId, path);
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true);
    try {
      if (mode === "create") {
        const res = await createPatient(values);
        if ("error" in res) {
          toast.error(res.error);
          return;
        }
        if (avatarFile) await uploadAvatar(res.id, avatarFile);
        toast.success("بیمار جدید با موفقیت ثبت شد.");
        router.push(`/patients/${res.id}`);
      } else if (patient) {
        const res = await updatePatient(patient.id, values);
        if ("error" in res && res.error) {
          toast.error(res.error);
          return;
        }
        if (avatarFile) await uploadAvatar(patient.id, avatarFile);
        toast.success("اطلاعات بیمار به‌روزرسانی شد.");
        router.push(`/patients/${patient.id}`);
      }
    } finally {
      setSaving(false);
    }
  });

  const err = (field: keyof PatientFormInput) =>
    form.formState.errors[field]?.message;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first_name">نام *</Label>
            <Input id="first_name" {...form.register("first_name")} />
            {err("first_name") ? (
              <p className="text-xs text-destructive">{err("first_name")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">نام خانوادگی *</Label>
            <Input id="last_name" {...form.register("last_name")} />
            {err("last_name") ? (
              <p className="text-xs text-destructive">{err("last_name")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="national_id">کد ملی (اختیاری)</Label>
            <Input
              id="national_id"
              dir="ltr"
              inputMode="numeric"
              maxLength={10}
              className="text-left"
              {...form.register("national_id")}
            />
            {err("national_id") ? (
              <p className="text-xs text-destructive">{err("national_id")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile">شماره موبایل *</Label>
            <Input
              id="mobile"
              dir="ltr"
              inputMode="numeric"
              placeholder="09123456789"
              className="text-left"
              {...form.register("mobile")}
            />
            {err("mobile") ? (
              <p className="text-xs text-destructive">{err("mobile")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth_date">تاریخ تولد</Label>
            <PersianDatePicker
              id="birth_date"
              value={isoToDateObject(birthIso || null)}
              onChange={(d) => form.setValue("birth_date", dateObjectToIso(d) ?? "")}
              placeholder="انتخاب تاریخ تولد"
            />
          </div>

          <div className="space-y-2">
            <Label>عکس بیمار (اختیاری)</Label>
            <div className="flex items-center gap-4">
              <Avatar className="size-14 border">
                {avatarPreview ? <AvatarImage src={avatarPreview} alt="عکس بیمار" /> : null}
                <AvatarFallback>
                  <ImagePlus className="size-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickAvatar(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="size-4" />
                {avatarFile || avatarPreview ? "تغییر عکس" : "انتخاب عکس"}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="address">آدرس (اختیاری)</Label>
            <Textarea id="address" rows={2} {...form.register("address")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">توضیحات (اختیاری)</Label>
            <Textarea id="notes" rows={3} {...form.register("notes")} />
          </div>
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
              ? "ثبت بیمار"
              : "ذخیره تغییرات"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={saving}
          onClick={() =>
            router.push(patient ? `/patients/${patient.id}` : "/patients")
          }
        >
          انصراف
        </Button>
      </div>
    </form>
  );
}
