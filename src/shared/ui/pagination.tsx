import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { toPersianDigits } from "@/shared/lib/persian";

interface PaginationProps {
  page: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: Record<string, string>;
}

function buildHref(
  baseUrl: string,
  searchParams: Record<string, string> | undefined,
  page: number,
) {
  const sp = new URLSearchParams(searchParams);
  sp.set("page", String(page));
  return `${baseUrl}?${sp.toString()}`;
}

export function Pagination({
  page,
  totalPages,
  baseUrl,
  searchParams,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      className="flex items-center justify-between gap-4 pt-2"
      aria-label="صفحه‌بندی"
    >
      <span className="text-sm text-muted-foreground">
        صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
      </span>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm" disabled={!hasPrev}>
          {hasPrev ? (
            <Link href={buildHref(baseUrl, searchParams, page - 1)}>
              <ChevronRight className="size-4" />
              قبلی
            </Link>
          ) : (
            <span>
              <ChevronRight className="size-4" />
              قبلی
            </span>
          )}
        </Button>
        <Button asChild variant="outline" size="sm" disabled={!hasNext}>
          {hasNext ? (
            <Link href={buildHref(baseUrl, searchParams, page + 1)}>
              بعدی
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <span>
              بعدی
              <ChevronLeft className="size-4" />
            </span>
          )}
        </Button>
      </div>
    </nav>
  );
}