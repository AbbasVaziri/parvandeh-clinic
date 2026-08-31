"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Users } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const ITEMS = [
  { href: "/", label: "داشبورد", icon: LayoutDashboard, exact: true },
  { href: "/patients", label: "بیماران", icon: Users, exact: false },
  { href: "/settings", label: "تنظیمات", icon: Settings, exact: false },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card md:hidden">
      <div className="grid grid-cols-3">
        {ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px]",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
