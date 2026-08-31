"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/shared/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-7 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">خطایی رخ داد</h2>
        <p className="text-sm text-muted-foreground">
          در بارگذاری این بخش مشکلی پیش آمد. دوباره تلاش کنید.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset}>
          <RotateCcw className="size-4" />
          تلاش مجدد
        </Button>
        <Button asChild variant="outline">
          <Link href="/">داشبورد</Link>
        </Button>
      </div>
    </div>
  );
}
