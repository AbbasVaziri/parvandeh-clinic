"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, FolderUp, LoaderCircle, Paperclip } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  MAX_DOCUMENT_SIZE,
  isAllowedDocumentType,
  formatFileSize,
} from "@/shared/lib/constants";
import { uploadFile } from "@/shared/lib/storage/client";
import { addDocumentMetadata } from "@/entities/document/api";

interface UploadDialogProps {
  patientId: string;
}

export function UploadDialog({ patientId }: UploadDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function pickFile(f: File | null) {
    if (!f) return;
    if (!isAllowedDocumentType(f.type)) {
      toast.error("فقط تصویر یا فایل PDF پذیرفته می‌شود.");
      return;
    }
    if (f.size > MAX_DOCUMENT_SIZE) {
      toast.error("حجم فایل حداکثر ۱۰ مگابایت است.");
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  function reset() {
    setTitle("");
    setDescription("");
    setFile(null);
  }

  async function handleSave() {
    if (!file) {
      toast.error("ابتدا فایل را انتخاب کنید.");
      return;
    }
    if (!title.trim()) {
      toast.error("عنوان مدرک را وارد کنید.");
      return;
    }

    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "bin").toLowerCase();
      const path = `patients/${patientId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await uploadFile(path, file);

      if (uploadError) {
        toast.error("بارگذاری فایل ناموفق بود. دوباره تلاش کنید.");
        return;
      }

      const res = await addDocumentMetadata({
        patient_id: patientId,
        title: title.trim(),
        description: description.trim() || null,
        storage_path: path,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      });

      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }

      toast.success("مدرک با موفقیت افزوده شد.");
      reset();
      setOpen(false);
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (uploading ? null : setOpen(v))}>
      <DialogTrigger asChild>
        <Button>
          <Paperclip className="size-4" />
          افزودن مدرک / تصویر
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>افزودن مدرک / تصویر</DialogTitle>
          <DialogDescription>
            تصویر یا PDF را انتخاب کنید؛ می‌توانید مستقیماً با دوربین گوشی هم عکس بگیرید.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <FolderUp className="size-4" />
              انتخاب فایل
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={uploading}
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="size-4" />
              عکس با دوربین
            </Button>
          </div>

          {file ? (
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <Paperclip className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </span>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="doc_title">عنوان *</Label>
            <Input
              id="doc_title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: برگه آزمایش"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc_desc">توضیح (اختیاری)</Label>
            <Textarea
              id="doc_desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" disabled={uploading} onClick={() => setOpen(false)}>
            انصراف
          </Button>
          <Button onClick={handleSave} disabled={uploading || !file}>
            {uploading ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {uploading ? "در حال بارگذاری…" : "افزودن"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
