import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { MobileTabBar } from "@/components/dashboard/mobile-tab-bar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  return (
    <div className="min-h-screen bg-secondary/30 pt-16 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0 md:pt-20">
      <DashboardNav />
      {children}
      <MobileTabBar />
    </div>
  );
}
