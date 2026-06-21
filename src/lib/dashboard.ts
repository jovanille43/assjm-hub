import { db } from "@/lib/db";

/** Données personnelles du membre connecté (profil joueur, stats, badges). */
export async function getMemberData(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      player: { include: { team: true } },
      badges: { include: { badge: true }, orderBy: { earnedAt: "desc" } },
    },
  });

  let playerStats: {
    goals: number;
    assists: number;
    minutes: number;
    matches: number;
    mvp: number;
    ratingAvg: number | null;
  } | null = null;

  if (user?.player) {
    const [agg, mvp, perMatch] = await Promise.all([
      db.matchStat.aggregate({
        where: { playerId: user.player.id },
        _sum: { goals: true, assists: true, minutes: true },
        _count: { _all: true },
      }),
      db.matchStat.count({ where: { playerId: user.player.id, isMvp: true } }),
      db.playerRating.groupBy({
        by: ["matchId"],
        where: { playerId: user.player.id },
        _avg: { rating: true },
      }),
    ]);
    const avgs = perMatch.map((r) => r._avg.rating).filter((x): x is number => x != null);
    const ratingAvg = avgs.length
      ? Math.round((avgs.reduce((s, x) => s + x, 0) / avgs.length) * 10) / 10
      : null;
    playerStats = {
      goals: agg._sum.goals ?? 0,
      assists: agg._sum.assists ?? 0,
      minutes: agg._sum.minutes ?? 0,
      matches: agg._count._all,
      mvp,
      ratingAvg,
    };
  }

  return { user, playerStats };
}

/** Prochains événements (entraînements, matchs, réunions...). */
export function getUpcomingEvents(limit = 5) {
  return db.event.findMany({
    where: { start: { gte: new Date() } },
    orderBy: { start: "asc" },
    take: limit,
    include: { team: true },
  });
}

/** Pour le staff : prochain match + état des réponses aux convocations. */
export async function getConvocationSummary() {
  const match = await db.match.findFirst({
    where: { status: "SCHEDULED", date: { gte: new Date() } },
    orderBy: { date: "asc" },
    include: { team: true, convocations: true },
  });
  if (!match) return null;
  const accepted = match.convocations.filter((c) => c.status === "ACCEPTED").length;
  const declined = match.convocations.filter((c) => c.status === "DECLINED").length;
  const pending = match.convocations.filter((c) => c.status === "PENDING").length;
  const uncertain = match.convocations.filter((c) => c.status === "UNCERTAIN").length;
  return { match, accepted, declined, pending, uncertain, total: match.convocations.length };
}
