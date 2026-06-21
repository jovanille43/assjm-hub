import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { db } from "@/lib/db";
import { MatchEditor, type MatchForEditor } from "@/components/match/match-editor";
import { NewMatchForm } from "@/components/match/new-match-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Centre de match" };

const STAFF_ROLES = ["ADMIN", "DIRIGEANT", "COACH"];

export default async function MatchCenterPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  if (!STAFF_ROLES.includes(session.user.role ?? "")) redirect("/dashboard");

  const [matches, teams] = await Promise.all([
    db.match.findMany({
      orderBy: { date: "desc" },
      take: 15,
      include: {
        team: { select: { name: true, players: { orderBy: [{ number: "asc" }], select: { id: true, firstName: true, lastName: true, number: true } } } },
        stats: { select: { playerId: true, goals: true, assists: true, isMvp: true } },
      },
    }),
    db.team.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const data: MatchForEditor[] = matches.map((m) => ({
    id: m.id,
    opponent: m.opponent,
    venue: m.venue,
    date: m.date.toISOString(),
    status: m.status,
    scoreFor: m.scoreFor,
    scoreAgainst: m.scoreAgainst,
    report: m.report,
    teamName: m.team.name,
    players: m.team.players,
    stats: m.stats,
  }));

  return (
    <div className="container max-w-2xl pb-8 pt-8 md:pb-16">
      <Link
        href="/dashboard/club"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Le club
      </Link>
      <PageHeader
        eyebrow="Staff"
        icon={ClipboardList}
        title="Centre de match"
        subtitle="Saisis le score, les buteurs et passeurs, l'homme du match et le résumé. Les pronostics et les badges sont réglés automatiquement."
      />

      <div className="mb-4">
        <NewMatchForm teams={teams} />
      </div>

      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Aucun match pour l'instant — crée le premier ci-dessus.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((m) => (
            <MatchEditor key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}
