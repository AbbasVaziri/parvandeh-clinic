"use client";

import {
  Avatar,
  AvatarFallback,
} from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { LogoutButton } from "@/features/auth/ui/logout-button";
import { Eye } from "lucide-react";

interface TopbarProps {
  clinicName: string;
  userName: string;
  roleLabel: string | null;
}

export function Topbar({ clinicName, userName, roleLabel }: TopbarProps) {
  const initial = userName.trim().charAt(0) || "ک";

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="flex h-14 items-center justify-between gap-3 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-2 md:hidden">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Eye className="size-4" />
          </div>
          <span className="truncate text-sm font-semibold">{clinicName}</span>
        </div>

        <p className="hidden text-sm text-muted-foreground md:block">
          {clinicName} — سامانه پرونده بیماران
        </p>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 gap-2 px-2"
              aria-label="منوی کاربر"
            >
              <Avatar className="size-8 border">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-40 truncate text-sm sm:inline">
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
            <div className="p-1">
              <LogoutButton />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
