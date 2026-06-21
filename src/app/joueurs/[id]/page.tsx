import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Award, ClipboardCheck, Goal, ShieldCheck, Sparkles, Star, Target, TrendingUp } from "lucide-react";
import { db } from "@/lib/db";
import { PlayerCard } from "@/components/player/player-card";
import { Card } from "@/components/ui/card";
import { RARITY } from "@/lib/enums";
import { RecentForm } from "@/components/player/recent-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = await db.player.findUnique({ where: { id }, select: { firstName: true, lastName: true } });
  return { title: p ? `${p.firstName} ${p.lastName} — Carte joueur` : "Joueur" };
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const player = await db.player.findUnique({
    where: { id },
    include: {
      team: true,
      user: {
        select: {
          image: true,
          badges: { include: { badge: true }, orderBy: { earnedAt: "desc" } },
        },
      },
      matchStats: {
        include: {
          match: { select: { opponent: true, date: true, scoreFor: true, scoreAgainst: true, venue: true } },
        },
        orderBy: { match: { date: "desc" } },
      },
    },
  });
  if (!player) notFound();

  const stats = player.matchStats;
  const goals = stats.reduce((s, m) => s + m.goals, 0);
  const assists = stats.reduce((s, m) => s + m.assists, 0);
  const mvp = stats.filter((m) => m.isMvp).length;

  const [perMatch, attendanceData, acceptedConvos, recentForm] = await Promise.all([
    db.playerRating.groupBy({ by: ["matchId"], where: { playerId: id }, _avg: { rating: true } }),
    db.eventAttendance.findMany({
      where: { playerId: id, event: { type: "TRAINING", cancelled: false } },
      select: { status: true },
    }),
    db.convocation.findMany({
      where: { playerId: id, status: "ACCEPTED", match: { status: "FINISHED" } },
      select: { match: { select: { scoreFor: true, scoreAgainst: true } } },
    }),
    db.convocation.findMany({
      where: { playerId: id, status: "ACCEPTED", match: { status: "FINISHED" } },
      select: { match: { select: { scoreFor: true, scoreAgainst: true, opponent: true, date: true } } },
      orderBy: { match: { date: "desc" } },
      take: 5,
    }),
  ]);

  const avgs = perMatch.map((r) => r._avg.rating).filter((x): x is number => x != null);
  const ratingAvg = avgs.length ? Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 10) / 10 : null;

  const totalEvents = attendanceData.length;
  const presentEvents = attendanceData.filter((a) => a.status === "PRESENT").length;
  const attendanceRate = totalEvents >= 3 ? Math.round((presentEvents / totalEvents) * 100) : null;

  const wins = acceptedConvos.filter((c) => (c.match.scoreFor ?? 0) > (c.match.scoreAgainst ?? 0)).length;
  const draws = acceptedConvos.filter((c) => c.match.scoreFor != null && c.match.scoreFor === c.match.scoreAgainst).length;
  const losses = acceptedConvos.filter((c) => c.match.scoreFor != null && (c.match.scoreFor ?? 0) < (c.match.scoreAgainst ?? 0)).length;

  const badges = player.user?.badges ?? [];
  const photo = player.photo ?? player.user?.image ?? null;

  const tiles = [
    { label: "Matchs", value: stats.length, icon: ShieldCheck },
    { label: "Buts", value: goals, icon: Goal },
    { label: "Passes déc.", value: assists, icon: Target },
    { label: "Star du match", value: mvp, icon: Star },
    { label: "Note moy.", value: ratingAvg ?? "–", icon: Sparkles },
    ...(attendanceRate !== null ? [{ label: "Assiduité", value: `${attendanceRate}%`, icon: ClipboardCheck }] : []),
  ];

  return (
    <div className="container max-w-4xl pb-16 pt-28 md:pt-32">
      <Link
        href="/joueurs"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Toutes les cartes
      </Link>

      <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-start">
        <div className="mx-auto md:mx-0">
          <PlayerCard player={{ ...player, photo }} />
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
              {player.firstName} {player.lastName}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {player.team ? player.team.name : "Sans équipe"}
              {player.number != null ? ` · #${player.number}` : ""}
            </p>
            {player.bio && <p className="mt-3 max-w-prose text-sm text-muted-foreground">{player.bio}</p>}
          </div>

          {/* Stats de la saison */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tiles.map((t) => (
              <div key={t.label} className="rounded-xl border bg-secondary/40 p-3 text-center">
                <t.icon className="mx-auto size-5 text-club" />
                <div className="mt-1 font-display text-2xl font-bold">{t.value}</div>
                <div className="text-[11px] text-muted-foreground">{t.label}</div>
              </div>
            ))}
          </div>

          {/* Forme récente (5 derniers matchs joués) */}
          {recentForm.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <TrendingUp className="size-4 text-club" /> Forme
              </span>
              <RecentForm matches={recentForm.map((c) => c.match)} />
            </div>
          )}

          {/* Bilan V/N/D */}
          {acceptedConvos.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border bg-emerald-500/10 p-3 text-center">
                <div className="font-display text-2xl font-bold text-emerald-500">{wins}</div>
                <div className="text-[11px] text-muted-foreground">Victoires</div>
              </div>
              <div className="rounded-xl border bg-secondary/40 p-3 text-center">
                <div className="font-display text-2xl font-bold">{draws}</div>
                <div className="text-[11px] text-muted-foreground">Nuls</div>
              </div>
              <div className="rounded-xl border bg-club/10 p-3 text-center">
                <div className="font-display text-2xl font-bold text-club">{losses}</div>
                <div className="text-[11px] text-muted-foreground">Défaites</div>
              </div>
            </div>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <div>
              <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
                <Award className="size-5 text-club" /> Badges
              </h2>
              <div className="flex flex-wrap gap-2">
                {badges.map((ub) => {
                  const r = RARITY[ub.badge.rarity] ?? RARITY.COMMON;
                  return (
                    <span
                      key={ub.id}
                      title={ub.badge.description}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium"
                      style={{ borderColor: r.from, background: `linear-gradient(135deg, ${r.from}22, ${r.to}11)` }}
                    >
                      <span>{ub.badge.icon}</span>
                      {ub.badge.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Derniers matchs */}
          {stats.length > 0 && (
            <div>
              <h2 className="mb-2 font-display text-lg font-bold">Derniers matchs</h2>
              <div className="space-y-2">
                {stats.slice(0, 6).map((m) => (
                  <Card key={m.id} className="flex items-center gap-3 p-3 text-sm">
                    <span className="font-display font-bold tabular-nums">
                      {m.match.scoreFor ?? "–"}
                      <span className="text-muted-foreground">-</span>
                      {m.match.scoreAgainst ?? "–"}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      <span className="text-muted-foreground">{m.match.venue === "HOME" ? "vs" : "@"}</span>{" "}
                      {m.match.opponent}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {format(new Date(m.match.date), "d MMM", { locale: fr })}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs tabular-nums">
                      {m.goals > 0 && <span>⚽ {m.goals}</span>}
                      {m.assists > 0 && <span>🅰️ {m.assists}</span>}
                      {m.isMvp && <Star className="size-4 text-amber-400" />}
                    </span>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
