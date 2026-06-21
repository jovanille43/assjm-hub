import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { db } from "@/lib/db";
import { EventManager } from "@/components/calendrier/event-manager";

export const dynamic = "force-dynamic";

const STAFF_ROLES = ["ADMIN", "DIRIGEANT", "COACH"];

export default async function DashboardCalendrierPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  if (!STAFF_ROLES.includes(session.user.role ?? "")) redirect("/dashboard");

  const [events, teams] = await Promise.all([
    db.event.findMany({
      orderBy: { start: "asc" },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            players: { orderBy: [{ number: "asc" }, { lastName: "asc" }], select: { id: true, firstName: true, lastName: true, number: true } },
          },
        },
        attendances: { select: { playerId: true, status: true } },
      },
    }),
    db.team.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  // Séparer passés / futurs
  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.start) >= now);
  const past = events.filter((e) => new Date(e.start) < now).reverse();

  return (
    <div className="container max-w-2xl pb-8 pt-8 md:pb-16">
      <PageHeader
        eyebrow="Staff"
        icon={CalendarDays}
        title="Gérer les événements"
        subtitle="Créez et modifiez les entraînements, matchs et réunions visibles par tous les membres."
      />

      <EventManager events={upcoming} teams={teams} />

      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-lg font-bold text-muted-foreground">
            Événements passés ({past.length})
          </h2>
          <div className="space-y-2 opacity-60">
            {past.slice(0, 5).map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-3 rounded-xl border bg-secondary/20 px-4 py-2.5 text-sm"
              >
                <span className="font-semibold">{ev.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(ev.start).toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
