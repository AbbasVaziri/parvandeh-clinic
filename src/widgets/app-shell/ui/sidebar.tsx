"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Eye, LayoutDashboard, ScanEye, Settings, Users } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "داشبورد", icon: LayoutDashboard, exact: true },
  { href: "/patients", label: "بیماران", icon: Users, exact: false },
  { href: "/settings", label: "تنظیمات", icon: Settings, exact: false },
];

export function Sidebar({ clinicName }: { clinicName: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-sidebar md:flex">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <ScanEye className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">{clinicName}</p>
          <p className="mt-0.5 text-[11px] text-sidebar-foreground/50">پرونده بیماران</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              {active && (
                <span className="absolute right-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-primary" />
              )}
              <item.icon className={cn("size-4.5", active && "text-sidebar-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="text-[11px] text-sidebar-foreground/30">نسخه 1.0</p>
      </div>
    </aside>
  );
}