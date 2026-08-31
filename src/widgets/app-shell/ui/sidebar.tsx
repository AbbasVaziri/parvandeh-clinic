"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Eye, LayoutDashboard, Settings, Users } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "داشبورد", icon: LayoutDashboard, exact: true },
  { href: "/patients", label: "بیماران", icon: Users, exact: false },
  { href: "/settings", label: "تنظیمات", icon: Settings, exact: false },
];

export function Sidebar({ clinicName }: { clinicName: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e bg-sidebar md:flex">
      <div className="flex items-center gap-3 border-b p-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Eye className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{clinicName}</p>
          <p className="text-xs text-muted-foreground">پرونده بیماران</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}
            >
              <item.icon className="size-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <p className="border-t p-4 text-[11px] text-muted-foreground">
        نسخه ۱.۰ — فقط برای استفاده پذیرش و پزشک کلینیک
      </p>
    </aside>
  );
}
