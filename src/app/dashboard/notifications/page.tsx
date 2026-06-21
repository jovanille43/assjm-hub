import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, CheckCheck } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { getNotifications } from "@/lib/notifications";
import { markAllRead } from "@/app/dashboard/notifications/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const items = await getNotifications(session.user.id, 50);
  const hasUnread = items.some((n) => !n.read);

  return (
    <div className="container max-w-2xl pb-8 pt-8 md:pb-16">
      <PageHeader
        eyebrow="Activité"
        icon={Bell}
        title="Notifications"
        action={
          hasUnread ? (
            <form action={markAllRead}>
              <Button variant="outline" size="sm" type="submit">
                <CheckCheck className="size-4" /> Tout lire
              </Button>
            </form>
          ) : null
        }
      />

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          <Bell className="mx-auto mb-2 size-8 opacity-40" />
          <p className="text-sm">Aucune notification pour l'instant.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const inner = (
              <Card
                className={cn(
                  "flex items-start gap-3 p-4 transition-colors",
                  n.link && "hover:border-club/50",
                  !n.read && "border-club/40 bg-club/5",
                )}
              >
                <span className="mt-0.5 text-2xl">{n.icon ?? "🔔"}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })}
                  </p>
                </div>
                {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-club" />}
              </Card>
            );
            return n.link ? (
              <Link key={n.id} href={n.link}>
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
