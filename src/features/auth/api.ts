"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn as authSignIn, signOut as authSignOut, auth } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";

export interface CurrentSession {
  user: { id: string; email: string | null };
  profile: { full_name: string | null; role_label: string | null } | null;
}

export async function signIn(
  email: string,
  password: string,
  next?: string
): Promise<{ error?: string }> {
  // Only allow relative paths to avoid open redirects.
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  try {
    await authSignIn("credentials", {
      email: email.trim(),
      password,
      redirectTo: target,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "ایمیل یا رمز عبور نادرست است." };
        case "CallbackRouteError":
          return { error: "خطا در فرآیند ورود. دوباره تلاش کنید." };
        default:
          return { error: "ورود ناموفق بود. لطفاً دوباره تلاش کنید." };
      }
    }
    throw error;
  }

  redirect(target);
}

export async function signOutAction(): Promise<void> {
  await authSignOut({ redirectTo: "/login" });
}

export async function fetchCurrentSession(): Promise<CurrentSession | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { rows } = await db.query<{
    full_name: string | null;
    role_label: string | null;
  }>("select full_name, role_label from profiles where id = $1", [
    session.user.id,
  ]);

  const profile = rows[0] ?? null;

  return {
    user: { id: session.user.id, email: session.user.email ?? null },
    profile: profile
      ? { full_name: profile.full_name, role_label: profile.role_label }
      : null,
  };
}
