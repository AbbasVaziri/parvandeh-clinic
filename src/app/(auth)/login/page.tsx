import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Eye } from "lucide-react";
import { auth } from "@/shared/lib/auth";
import { LoginForm } from "@/features/auth/ui/login-form";

export const metadata: Metadata = { title: "ورود" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { next } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Eye className="size-7" />
          </div>
          <h1 className="text-xl font-semibold">سامانه پرونده بیماران</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            دسترسی فقط برای پذیرش و پزشک کلینیک
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <LoginForm next={next} />
        </div>
      </div>
    </main>
  );
}