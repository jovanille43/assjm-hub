import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Award, ClipboardCheck, Goal, Sparkles, Star, Target } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Avatar } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Palmarès" };

async function getPalmares() {
  const [topScorerAgg, topAssistAgg, ratingAgg, allAtt, playersList] = await Promise.all([
    db.matchStat.groupBy({ by: ["playerId"], _sum: { goals: true }, orderBy: { _sum: { goals: "desc" } }, take: 1 }),
    db.matchStat.groupBy({ by: ["playerId"], _sum: { assists: true }, orderBy: { _sum: { assists: "desc" } }, take: 1 }),
    db.playerRating.groupBy({ by: ["playerId", "matchId"], _avg: { rating: true } }),
    db.eventAttendance.findMany({
      select: { playerId: true, status: true },
      where: { event: { type: "TRAINING", cancelled: false } },
    }),
    db.player.findMany({
      select: { id: true, firstName: true, lastName: true, photo: true, user: { select: { image: true } } },
    }),
  ]);

  const playerMap = new Map(playersList.map((p) => [p.id, p]));

  function playerName(id: string) {
    const p = playerMap.get(id);
    return p ? `${p.firstName} ${p.lastName}` : "–";
  }
  function playerImage(id: string) {
    const p = playerMap.get(id);
    return p?.photo ?? p?.user?.image ?? null;
  }

  // Top scorer
  const topScorer = topScorerAgg[0] && (topScorerAgg[0]._sum.goals ?? 0) > 0
    ? { id: topScorerAgg[0].playerId, value: topScorerAgg[0]._sum.goals ?? 0 }
    : null;

  // Top passeur
  const topAssist = topAssistAgg[0] && (topAssistAgg[0]._sum.assists ?? 0) > 0
    ? { id: topAssistAgg[0].playerId, value: topAssistAgg[0]._sum.assists ?? 0 }
    : null;

  // Meilleure note (min 3 matchs)
  const matchAvgs = new Map<string, number[]>();
  for (const r of ratingAgg) {
    if (r._avg.rating == null) continue;
    const arr = matchAvgs.get(r.playerId) ?? [];
    arr.push(r._avg.rating);
    matchAvgs.set(r.playerId, arr);
  }
  const bestRated = [...matchAvgs.entries()]
    .filter(([, arr]) => arr.length >= 3)
    .map(([pid, arr]) => ({ id: pid, avg: arr.reduce((s, x) => s + x, 0) / arr.length, matches: arr.length }))
    .sort((a, b) => b.avg - a.avg)[0] ?? null;

  // Meilleure assiduité (min 3 séances)
  const attMap = new Map<string, { total: number; present: number }>();
  for (const a of allAtt) {
    const cur = attMap.get(a.playerId) ?? { total: 0, present: 0 };
    cur.total++;
    if (a.status === "PRESENT") cur.present++;
    attMap.set(a.playerId, cur);
  }
  const bestAttEntry = [...attMap.entries()]
    .filter(([, v]) => v.total >= 3)
    .map(([pid, v]) => ({ id: pid, rate: Math.round((v.present / v.total) * 100), total: v.total }))
    .sort((a, b) => b.rate - a.rate)[0] ?? null;

  return { topScorer, topAssist, bestRated, bestAttEntry, playerName, playerImage };
}

export default async function PalmaresPage() {
  const { topScorer, topAssist, bestRated, bestAttEntry, playerName, playerImage } = await getPalmares();

  const trophies = [
    {
      icon: Goal,
      label: "Meilleur buteur",
      player: topScorer ? playerName(topScorer.id) : null,
      image: topScorer ? playerImage(topScorer.id) : null,
      value: topScorer ? `${topScorer.value} but${topScorer.value !== 1 ? "s" : ""}` : null,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      icon: Target,
      label: "Meilleur passeur",
      player: topAssist ? playerName(topAssist.id) : null,
      image: topAssist ? playerImage(topAssist.id) : null,
      value: topAssist ? `${topAssist.value} passe${topAssist.value !== 1 ? "s" : ""}` : null,
      color: "text-sky-500",
      bg: "bg-sky-500/10",
    },
    {
      icon: Star,
      label: "Joueur le mieux noté",
      player: bestRated ? playerName(bestRated.id) : null,
      image: bestRated ? playerImage(bestRated.id) : null,
      value: bestRated ? `${Math.round(bestRated.avg * 10) / 10}/10 moy.` : null,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: ClipboardCheck,
      label: "Meilleure assiduité",
      player: bestAttEntry ? playerName(bestAttEntry.id) : null,
      image: bestAttEntry ? playerImage(bestAttEntry.id) : null,
      value: bestAttEntry ? `${bestAttEntry.rate}% de présence` : null,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="container max-w-2xl pb-8 pt-8 md:pb-16">
      <Link
        href="/dashboard/club"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Le club
      </Link>

      <PageHeader
        eyebrow="Le club"
        icon={Award}
        title="Palmarès"
        subtitle="Les meilleurs joueurs de la saison en cours."
      />

      <div className="space-y-4">
        {trophies.map((t) => (
          <Card key={t.label} className="flex items-center gap-4 p-5">
            <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${t.bg}`}>
              <t.icon className={`size-6 ${t.color}`} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.label}
              </p>
              {t.player ? (
                <>
                  <div className="mt-1 flex items-center gap-2">
                    <Avatar name={t.player} src={t.image} size="sm" />
                    <p className="truncate font-display text-lg font-bold">{t.player}</p>
                  </div>
                  <p className={`mt-0.5 text-sm font-semibold ${t.color}`}>{t.value}</p>
                </>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">Pas encore de données.</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
