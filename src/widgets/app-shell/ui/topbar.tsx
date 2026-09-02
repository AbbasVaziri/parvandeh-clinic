"use client";

import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { LogoutButton } from "@/features/auth/ui/logout-button";
import { LogOut, Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

interface TopbarProps {
  clinicName: string;
  userName: string;
  roleLabel: string | null;
}

export function Topbar({ clinicName, userName, roleLabel }: TopbarProps) {
  const initial = userName.trim().charAt(0) || "ک";
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3 md:hidden">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-xs font-bold">CP</span>
          </div>
          <span className="truncate text-sm font-medium">{clinicName}</span>
        </div>

        <p className="hidden text-sm text-muted-foreground md:block">
          {clinicName}
        </p>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="تغییر تم"
            className="text-muted-foreground hover:text-foreground"
          >
            <Sun className="size-4 dark:hidden" />
            <Moon className="hidden size-4 dark:block" />
          </Button>

          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 gap-2 px-2 text-muted-foreground hover:text-foreground"
                aria-label="منوی کاربر"
              >
                <Avatar className="size-7 border">
                  <AvatarFallback className="bg-primary/10 text-[10px] font-medium text-primary">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-28 truncate text-sm sm:inline">
                  {userName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>
                <p className="truncate text-sm font-medium">{userName}</p>
                {roleLabel ? (
                  <p className="text-xs text-muted-foreground">{roleLabel}</p>
                ) : null}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <LogoutButton />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}