import { redirect } from "next/navigation";
import { Sidebar } from "@/widgets/app-shell/ui/sidebar";
import { Topbar } from "@/widgets/app-shell/ui/topbar";
import { MobileNav } from "@/widgets/app-shell/ui/mobile-nav";
import { fetchCurrentSession } from "@/features/auth/api";
import { getClinicName } from "@/entities/settings/api";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await fetchCurrentSession();
  if (!session) redirect("/login");

  const clinicName = await getClinicName();
  const userName =
    session.profile?.full_name?.trim() || session.user.email || "کاربر";

  return (
    <div className="flex min-h-dvh">
      <Sidebar clinicName={clinicName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          clinicName={clinicName}
          userName={userName}
          roleLabel={session.profile?.role_label ?? null}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-12">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
