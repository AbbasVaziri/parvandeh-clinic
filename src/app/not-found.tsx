import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/shared/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="size-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">صفحه مورد نظر پیدا نشد</h1>
        <p className="text-sm text-muted-foreground">
          آدرس وارد شده وجود ندارد یا جابه‌جا شده است.
        </p>
      </div>
      <Button asChild>
        <Link href="/">بازگشت به داشبورد</Link>
      </Button>
    </div>
  );
}
