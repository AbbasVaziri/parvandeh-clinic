"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { signOutAction } from "../api";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => void (await signOutAction()))}
      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10 disabled:opacity-50"
    >
      <LogOut className="size-4" />
      {pending ? "در حال خروج..." : "خروج از حساب"}
    </button>
  );
}
