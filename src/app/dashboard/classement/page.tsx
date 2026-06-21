import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, Swords, Target, Star, Crown, ClipboardCheck } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { getLeaderboard, type Ranked } from "@/lib/leaderboard";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Classement" };

const MEDALS = ["🥇", "🥈", "🥉"];

function MiniBoard({
  title,
  icon: Icon,
  unit,
  rows,
}: {
  title: string;
  icon: typeof Swords;
  unit: string;
  rows: Ranked[];
}) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold">
        <Icon className="size-4 text-club" /> {title}
      </h2>
      {rows.length === 0 ? (
        <p className="py-3 text-center text-xs text-muted-foreground">Pas encore de classement.</p>
      ) : (
        <div className="space-y-1.5">
          {rows.slice(0, 5).map((r) => (
            <div
              key={r.id}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
                r.me && "bg-club/10 ring-1 ring-club/30",
              )}
            >
              <span className="w-5 shrink-0 text-center text-xs font-bold text-muted-foreground">
                {MEDALS[r.rank - 1] ?? r.rank}
              </span>
              <Avatar name={r.name} src={r.image} size="sm" />
              <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
              <span className="shrink-0 font-display font-bold tabular-nums">
                {r.value}
                <span className="ml-1 text-[10px] font-normal text-muted-foreground">{unit}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default async function ClassementPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const board = await getLeaderboard(session.user.id);
  const monthName = new Date().toLocaleDateString("fr-FR", { month: "long" });

  return (
    <div className="container max-w-2xl pb-8 pt-8 md:pb-16">
      <Link
        href="/dashboard/club"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Le club
      </Link>
      <PageHeader
        eyebrow="Statistiques"
        icon={Trophy}
        title="Classement du club"
        subtitle="Performances des membres : notes de match, points, duels et pronostics."
      />

      {/* Joueur du mois */}
      {board.playerOfMonth && (
        <Card className="mb-6 overflow-hidden p-0">
          <div className="flex items-center gap-4 bg-gradient-to-r from-amber-500/10 to-club/10 p-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-400/20 text-2xl">
              👑
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
                <Crown className="size-3.5" /> Joueur du mois de {monthName}
              </p>
              <p className="mt-0.5 truncate font-display text-xl font-extrabold">
                {board.playerOfMonth.name}
                {board.playerOfMonth.me && <span className="ml-1.5 text-sm text-club">(toi)</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                Moyenne {board.playerOfMonth.avg}/10 sur {board.playerOfMonth.matches} match{board.playerOfMonth.matches !== 1 ? "s" : ""}
              </p>
            </div>
            <span className="shrink-0 font-display text-4xl font-extrabold tabular-nums text-amber-400">
              {board.playerOfMonth.avg}
            </span>
          </div>
        </Card>
      )}

      {/* Classement principal : points */}
      <Card className="mb-6 p-4">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
          <Trophy className="size-5 text-club" /> Top points
        </h2>
        {board.points.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Aucun classement.</p>
        ) : (
          <div className="space-y-1.5">
            {board.points.map((r) => (
              <div
                key={r.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2",
                  r.rank <= 3 && "bg-secondary/40",
                  r.me && "bg-club/10 ring-1 ring-club/30",
                )}
              >
                <span className="w-6 shrink-0 text-center font-display text-lg font-extrabold text-muted-foreground">
                  {MEDALS[r.rank - 1] ?? r.rank}
                </span>
                <Avatar name={r.name} src={r.image} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {r.name} {r.me && <span className="text-xs text-club">(toi)</span>}
                  </p>
                  {r.ovr != null && (
                    <p className="text-xs text-muted-foreground">Carte {r.ovr}</p>
                  )}
                </div>
                <span className="shrink-0 font-display text-lg font-extrabold tabular-nums">
                  {r.value}
                  <span className="ml-1 text-[10px] font-normal text-muted-foreground">pts</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Notes de la saison (3ᵉ mi-temps) */}
      {board.topRated.length > 0 && (
        <Card className="mb-6 p-4">
          <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-bold">
            <Star className="size-5 text-club" /> Meilleures notes de la saison
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Moyenne des notes par match (min. 3 matchs notés).
          </p>
          <div className="space-y-1.5">
            {board.topRated.map((r) => (
              <div
                key={r.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2",
                  r.rank <= 3 && "bg-secondary/40",
                  r.me && "bg-club/10 ring-1 ring-club/30",
                )}
              >
                <span className="w-6 shrink-0 text-center font-display text-lg font-extrabold text-muted-foreground">
                  {MEDALS[r.rank - 1] ?? r.rank}
                </span>
                <Avatar name={r.name} src={r.image} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {r.name} {r.me && <span className="text-xs text-club">(toi)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.matches} matchs{r.mvp > 0 ? ` · ⭐ ${r.mvp}× Star` : ""}
                  </p>
                </div>
                <span className="shrink-0 font-display text-lg font-extrabold tabular-nums">
                  {r.avg}
                  <span className="ml-1 text-[10px] font-normal text-muted-foreground">/10</span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <MiniBoard title="Duels" icon={Swords} unit="V" rows={board.duelists} />
        <MiniBoard title="Pronos" icon={Target} unit="pts" rows={board.pronos} />
      </div>

      {board.topAttendance.length > 0 && (
        <div className="mt-4">
          <MiniBoard title="Assiduité aux entraînements" icon={ClipboardCheck} unit="%" rows={board.topAttendance} />
        </div>
      )}
    </div>
  );
}
