import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Target, Trophy, Flame, Medal } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { getLeagueData, type LeagueRow } from "@/lib/prono-league";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ligue des pronostiqueurs" };

const MEDALS = ["🥇", "🥈", "🥉"];

function LeagueTable({ rows, compact = false }: { rows: LeagueRow[]; compact?: boolean }) {
  if (rows.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">Pas encore de classement.</p>;
  }
  const displayed = compact ? rows.slice(0, 5) : rows;
  return (
    <div className="space-y-1">
      {!compact && (
        <div className="flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <span className="w-6" />
          <span className="flex-1">Joueur</span>
          <span className="w-10 text-right">J</span>
          <span className="w-10 text-right">⭐</span>
          <span className="w-14 text-right">Pts</span>
        </div>
      )}
      {displayed.map((r) => (
        <div
          key={r.userId}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
            r.rank <= 3 && !compact && "bg-secondary/40",
            r.me && "bg-club/10 ring-1 ring-club/30",
          )}
        >
          <span className="w-6 shrink-0 text-center text-xs font-bold text-muted-foreground">
            {MEDALS[r.rank - 1] ?? r.rank}
          </span>
          <Avatar name={r.name} src={r.image} size="sm" />
          <span className="min-w-0 flex-1 truncate font-medium">
            {r.name}{r.me && <span className="ml-1 text-xs text-club">(toi)</span>}
          </span>
          {!compact && (
            <>
              <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">{r.played}</span>
              <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                {r.perfect > 0 ? `${r.perfect}×` : "—"}
              </span>
            </>
          )}
          <span className="w-14 shrink-0 text-right font-display font-bold tabular-nums">
            {r.totalPts}
            <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">pts</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function weekLabel(weekKey: string, startDate: string): string {
  const date = new Date(startDate);
  const [, weekStr] = weekKey.split("-W");
  return `Semaine ${weekStr} · ${date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
}

export default async function LiguePage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const { season, journees, myRank } = await getLeagueData(session.user.id);

  return (
    <div className="container max-w-2xl pb-8 pt-8 md:pb-16">
      <Link
        href="/dashboard/pronos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Retour aux pronos
      </Link>
      <PageHeader
        eyebrow="Pronostics"
        icon={Trophy}
        title="Ligue des pronostiqueurs"
        subtitle="Classement de la saison — chaque match joué compte. Score exact = 10 pts, sens du résultat = 5 pts."
      />

      {/* Mon rang */}
      {myRank && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-club/10 px-4 py-3 ring-1 ring-club/25">
          <Medal className="size-5 text-club" />
          <div>
            <p className="text-sm font-bold">Tu es {myRank <= 3 ? MEDALS[myRank - 1] : `#${myRank}`} au classement</p>
            {season.find((r) => r.me) && (
              <p className="text-xs text-muted-foreground">
                {season.find((r) => r.me)!.totalPts} pts · {season.find((r) => r.me)!.played} match(s) ·{" "}
                {season.find((r) => r.me)!.perfect} score(s) exact(s)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Classement de la saison */}
      <Card className="mb-6 p-4">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
          <Trophy className="size-5 text-club" /> Classement général de la saison
        </h2>
        <LeagueTable rows={season} />
      </Card>

      {/* Journées */}
      {journees.length > 0 && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <Flame className="size-5 text-club" /> Classements par journée
          </h2>
          {journees.map((j) => (
            <Card key={j.weekKey} className="p-4">
              <div className="mb-3">
                <p className="font-display font-bold">{weekLabel(j.weekKey, j.startDate)}</p>
                {j.opponents.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {j.opponents.map((o) => `vs ${o}`).join(" · ")}
                  </p>
                )}
              </div>
              <LeagueTable rows={j.rows} compact />
            </Card>
          ))}
        </div>
      )}

      {season.length === 0 && (
        <Card className="p-8 text-center">
          <Target className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="font-display font-bold">Pas encore de pronostics résolus</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Les classements apparaîtront une fois les premiers matchs terminés.
          </p>
          <Link href="/dashboard/pronos" className="mt-4 inline-block text-sm font-medium text-club hover:underline">
            Faire mes pronos →
          </Link>
        </Card>
      )}
    </div>
  );
}
