import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Download, Goal, ShieldAlert, Star, Target } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { resultOf } from "@/lib/enums";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rapport de saison" };

const STAFF = ["ADMIN", "DIRIGEANT", "COACH"];

export default async function SaisonPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  if (!STAFF.includes(session.user.role ?? "")) redirect("/dashboard");

  const players = await db.player.findMany({
    include: {
      team: { select: { name: true } },
      matchStats: {
        where: { match: { status: "FINISHED" } },
        select: { goals: true, assists: true, minutes: true, yellow: true, red: true, rating: true, isMvp: true, started: true },
      },
      convocations: {
        where: { status: "ACCEPTED", match: { status: "FINISHED" } },
        select: { match: { select: { scoreFor: true, scoreAgainst: true } } },
      },
    },
    orderBy: [{ team: { name: "asc" } }, { lastName: "asc" }],
  });

  const rows = players
    .map((p) => {
      const ms = p.matchStats;
      const goals = ms.reduce((s, m) => s + m.goals, 0);
      const assists = ms.reduce((s, m) => s + m.assists, 0);
      const yellow = ms.reduce((s, m) => s + m.yellow, 0);
      const red = ms.reduce((s, m) => s + m.red, 0);
      const mvp = ms.filter((m) => m.isMvp).length;
      const ratings = ms.map((m) => m.rating).filter((r): r is number => r != null);
      const avgRating = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null;

      const convos = p.convocations;
      const wins = convos.filter((c) => resultOf(c.match.scoreFor, c.match.scoreAgainst) === "W").length;
      const draws = convos.filter((c) => resultOf(c.match.scoreFor, c.match.scoreAgainst) === "D").length;
      const losses = convos.filter((c) => resultOf(c.match.scoreFor, c.match.scoreAgainst) === "L").length;

      return { p, goals, assists, yellow, red, mvp, avgRating, wins, draws, losses, played: convos.length };
    })
    .filter((r) => r.played > 0 || r.p.matchStats.length > 0);

  const totalMatches = await db.match.count({ where: { status: "FINISHED" } });
  const totalGoals = rows.reduce((s, r) => s + r.goals, 0);

  return (
    <div className="container max-w-5xl pb-16 pt-8">
      <PageHeader
        eyebrow="Staff"
        icon={BarChart3}
        title="Rapport de saison"
        subtitle={`${totalMatches} matchs joués · ${totalGoals} buts marqués cette saison.`}
        action={
          <Link
            href="/api/saison"
            className="inline-flex items-center gap-2 rounded-xl border bg-secondary px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/80"
          >
            <Download className="size-4" /> Export CSV
          </Link>
        }
      />

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="border-b bg-secondary/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Joueur</th>
              <th className="px-3 py-3 text-left">Équipe</th>
              <th className="px-3 py-3 text-center" title="Matchs joués">MJ</th>
              <th className="px-3 py-3 text-center">V</th>
              <th className="px-3 py-3 text-center">N</th>
              <th className="px-3 py-3 text-center">D</th>
              <th className="px-3 py-3 text-center" title="Buts"><Goal className="mx-auto size-3.5" /></th>
              <th className="px-3 py-3 text-center" title="Passes décisives"><Target className="mx-auto size-3.5" /></th>
              <th className="px-3 py-3 text-center" title="Cartons jaunes / rouges"><ShieldAlert className="mx-auto size-3.5" /></th>
              <th className="px-3 py-3 text-center" title="Étoiles du match"><Star className="mx-auto size-3.5" /></th>
              <th className="px-3 py-3 text-center">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.p.id} className="transition-colors hover:bg-secondary/20">
                <td className="px-4 py-3 font-medium capitalize">
                  {r.p.number != null && (
                    <span className="mr-1.5 text-xs text-muted-foreground">#{r.p.number}</span>
                  )}
                  {r.p.firstName} {r.p.lastName}
                </td>
                <td className="px-3 py-3 text-muted-foreground">{r.p.team?.name ?? "—"}</td>
                <td className="px-3 py-3 text-center font-semibold">{r.played}</td>
                <td className="px-3 py-3 text-center text-emerald-600">{r.wins}</td>
                <td className="px-3 py-3 text-center text-muted-foreground">{r.draws}</td>
                <td className="px-3 py-3 text-center text-club">{r.losses}</td>
                <td className="px-3 py-3 text-center font-semibold">{r.goals || "—"}</td>
                <td className="px-3 py-3 text-center">{r.assists || "—"}</td>
                <td className="px-3 py-3 text-center text-xs">
                  {r.yellow > 0 && <span className="mr-1">🟨{r.yellow}</span>}
                  {r.red > 0 && <span>🟥{r.red}</span>}
                  {r.yellow === 0 && r.red === 0 && "—"}
                </td>
                <td className="px-3 py-3 text-center">{r.mvp > 0 ? r.mvp : "—"}</td>
                <td className="px-3 py-3 text-center">{r.avgRating ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Aucune donnée de saison disponible.
          </div>
        )}
      </div>
    </div>
  );
}
