"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";
import { faAuthError } from "@/shared/lib/errors";

export interface CurrentSession {
  user: { id: string; email: string | null };
  profile: { full_name: string | null; role_label: string | null } | null;
}

export async function signIn(
  email: string,
  password: string,
  next?: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) return { error: faAuthError(error.message) };

  // Only allow relative paths to avoid open redirects.
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  redirect(target);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function fetchCurrentSession(): Promise<CurrentSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role_label")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user: { id: user.id, email: user.email ?? null },
    profile: profile ?? null,
  };
}
