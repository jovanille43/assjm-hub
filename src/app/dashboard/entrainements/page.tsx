import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dumbbell, Check, X, Minus } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { cn } from "@/lib/utils";
import { RemindTrainingButton } from "./remind-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Présences entraînements" };

const STAFF = ["ADMIN", "DIRIGEANT", "COACH"];

export default async function EntrainementsPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  if (!STAFF.includes(session.user.role ?? "")) redirect("/dashboard");

  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const twoWeeksAhead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const events = await db.event.findMany({
    where: {
      type: "TRAINING",
      cancelled: false,
      start: { gte: twoWeeksAgo, lte: twoWeeksAhead },
    },
    include: {
      team: {
        include: {
          players: {
            orderBy: [{ number: "asc" }, { lastName: "asc" }],
            select: { id: true, firstName: true, lastName: true, number: true },
          },
        },
      },
      attendances: { select: { playerId: true, status: true } },
    },
    orderBy: { start: "asc" },
  });

  return (
    <div className="container max-w-3xl pb-16 pt-8">
      <PageHeader
        eyebrow="Staff"
        icon={Dumbbell}
        title="Présences entraînements"
        subtitle="Qui est présent, absent ou n'a pas encore répondu — sur les 2 dernières / 2 prochaines semaines."
      />

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Aucun entraînement sur cette période.
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => {
            const attMap = new Map(ev.attendances.map((a) => [a.playerId, a.status]));
            const players = ev.team?.players ?? [];
            const present = players.filter((p) => attMap.get(p.id) === "PRESENT");
            const absent = players.filter((p) => attMap.get(p.id) === "ABSENT");
            const pending = players.filter((p) => !attMap.has(p.id));
            const isPast = ev.start < now;

            return (
              <div key={ev.id} className="rounded-2xl border bg-card p-5">
                {/* En-tête */}
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {ev.team?.name ?? "Équipe inconnue"} ·{" "}
                      {isPast ? "Passé" : "À venir"}
                    </p>
                    <h2 className="mt-0.5 font-display text-lg font-bold">{ev.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(ev.start), "EEEE d MMMM, HH:mm", { locale: fr })}
                      {ev.location && ` · ${ev.location}`}
                    </p>
                  </div>

                  {/* Compteurs */}
                  <div className="flex shrink-0 gap-2 text-sm">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-600">
                      <Check className="size-3.5" /> {present.length}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-club/10 px-2.5 py-1 font-semibold text-club">
                      <X className="size-3.5" /> {absent.length}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 font-semibold text-muted-foreground">
                      <Minus className="size-3.5" /> {pending.length}
                    </span>
                  </div>
                </div>

                {/* Roster */}
                <div className="flex flex-wrap gap-1.5">
                  {players.map((p) => {
                    const status = attMap.get(p.id) ?? null;
                    return (
                      <span
                        key={p.id}
                        className={cn(
                          "rounded-md px-2 py-0.5 text-xs font-medium capitalize",
                          status === "PRESENT" && "bg-emerald-500/15 text-emerald-700",
                          status === "ABSENT" && "bg-club/15 text-club",
                          !status && "bg-secondary text-muted-foreground",
                        )}
                      >
                        {p.number != null ? `#${p.number} ` : ""}
                        {p.firstName} {p.lastName}
                      </span>
                    );
                  })}
                </div>

                {/* Relance */}
                {!isPast && pending.length > 0 && (
                  <div className="mt-4 border-t pt-3">
                    <RemindTrainingButton eventId={ev.id} pendingCount={pending.length} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
