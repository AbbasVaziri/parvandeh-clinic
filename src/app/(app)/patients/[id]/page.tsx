import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  Glasses,
  FileText,
  FolderOpen,
  Pencil,
  Phone,
  IdCard,
  Plus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { faDate } from "@/shared/lib/jalali";
import { PatientSearch } from "@/features/patient-search/ui/patient-search";
import { UploadDialog } from "@/features/document-upload/ui/upload-dialog";
import { DeleteDocumentButton } from "@/features/document-upload/ui/delete-document-button";
import { ProfileTabs } from "@/widgets/patient-profile/ui/profile-tabs";
import { getPatientById } from "@/entities/patient/api";
import { listExaminationsByPatient } from "@/entities/examination/api";
import { listDocumentsByPatient } from "@/entities/document/api";
import { createFileUrl } from "@/shared/lib/storage/server";
import { formatFileSize } from "@/shared/lib/constants";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const patient = await getPatientById(id);
  return { title: patient ? `${patient.first_name} ${patient.last_name}` : "پروفایل بیمار" };
}

export default async function PatientProfilePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab } = await searchParams;

  const patient = await getPatientById(id);
  if (!patient) notFound();

  const [avatarUrl, exams, docs] = await Promise.all([
    patient.avatar_path ? createFileUrl(patient.avatar_path) : Promise.resolve(null),
    listExaminationsByPatient(id),
    listDocumentsByPatient(id),
  ]);

  const fullName = `${patient.first_name} ${patient.last_name}`;

  const infoTab = (
    <Card>
      <CardContent className="p-6">
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">نام و نام خانوادگی</dt>
            <dd className="mt-1 font-medium">{fullName}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">کد ملی</dt>
            <dd className="mt-1 font-medium" dir="ltr">
              {patient.national_id}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">شماره موبایل</dt>
            <dd className="mt-1 font-medium" dir="ltr">
              {patient.mobile}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">تاریخ تولد</dt>
            <dd className="mt-1 font-medium">{faDate(patient.birth_date)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">آدرس</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm leading-7">
              {patient.address || "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">توضیحات</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm leading-7">
              {patient.notes || "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">ثبت / آخرین ویرایش</dt>
            <dd className="mt-1 text-sm text-muted-foreground">
              {faDate(patient.created_at, true)} — {faDate(patient.updated_at, true)}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );

  const examsTab =
    exams.length === 0 ? (
      <EmptyState
        icon={FileText}
        title="هنوز معاینه‌ای ثبت نشده است"
        description="اولین معاینه این بیمار را ثبت کنید."
        action={
          <Button asChild size="sm">
            <Link href={`/patients/${id}/examinations/new`}>
              <Plus className="size-4" />
              ثبت معاینه جدید
            </Link>
          </Button>
        }
      />
    ) : (
      <div className="divide-y overflow-hidden rounded-xl border">
        {exams.map((e) => (
          <div
            key={e.id}
            className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{faDate(e.exam_date, true)}</p>
              <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                {e.notes ? e.notes : "بدون یادداشت"}
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0 self-start sm:self-auto">
              <Link href={`/examinations/${e.id}`}>مشاهده</Link>
            </Button>
          </div>
        ))}
      </div>
    );

  const docsTab = (
    <div className="space-y-4">
      <div className="flex justify-end">
        <UploadDialog patientId={id} />
      </div>
      {docs.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="هنوز مدرکی افزوده نشده است"
          description="تصاویر و PDFهای مربوط به این بیمار را اینجا نگه دارید."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => {
            const isImage = (doc.mime_type ?? "").startsWith("image/");
            return (
              <div key={doc.id} className="group overflow-hidden rounded-xl border">
                <div className="relative flex h-36 items-center justify-center overflow-hidden bg-muted/40">
                  {isImage && doc.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={doc.url}
                      alt={doc.title ?? doc.file_name ?? "مدرک"}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <FileText className="size-10 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-1.5 p-4">
                  <p className="truncate text-sm font-medium">{doc.title || doc.file_name}</p>
                  {doc.description ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {doc.description}
                    </p>
                  ) : null}
                  <p className="text-[11px] text-muted-foreground">
                    {faDate(doc.created_at, true)}
                    {doc.size_bytes ? ` — ${formatFileSize(doc.size_bytes)}` : ""}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    {doc.url ? (
                      <Button asChild variant="outline" size="xs">
                        <a href={doc.url} target="_blank" rel="noreferrer">
                          مشاهده
                        </a>
                      </Button>
                    ) : null}
                    <div className="me-auto">
                      <DeleteDocumentButton
                        documentId={doc.id}
                        documentTitle={doc.title ?? doc.file_name ?? "مدرک"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ms-2 text-muted-foreground">
        <Link href="/patients">
          <ChevronRight className="size-4" />
          بیماران
        </Link>
      </Button>

      {/* header */}
      <section className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar className="size-18 border">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName} /> : null}
            <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
              {patient.first_name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold md:text-2xl">{fullName}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1">
                <IdCard className="size-3.5" />
                <span dir="ltr">{patient.national_id}</span>
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Phone className="size-3.5" />
                <span dir="ltr">{patient.mobile}</span>
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <CalendarDays className="size-3.5" />
                {faDate(patient.birth_date)}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <Button asChild size="lg">
              <Link href={`/patients/${id}/examinations/new`}>
                <Glasses className="size-4" />
                ثبت معاینه جدید
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/patients/${id}/edit`}>
                <Pencil className="size-4" />
                ویرایش
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <ProfileTabs
        defaultTab={tab ?? "info"}
        examCount={exams.length}
        docCount={docs.length}
        info={infoTab}
        exams={examsTab}
        docs={docsTab}
      />
    </div>
  );
}