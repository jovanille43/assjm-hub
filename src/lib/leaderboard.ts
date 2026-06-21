import { db } from "@/lib/db";

const UPGRADE_BONUS = [0, 2, 4, 7, 11, 16];

function ovrOf(p: {
  pace: number; shooting: number; passing: number;
  dribbling: number; defending: number; physical: number; upgradeLevel: number;
}): number {
  const b = UPGRADE_BONUS[p.upgradeLevel] ?? 0;
  return Math.round((p.pace + p.shooting + p.passing + p.dribbling + p.defending + p.physical) / 6 + b);
}

export type Ranked = {
  rank: number;
  id: string;
  name: string;
  image: string | null;
  value: number;
  ovr?: number | null;
  me: boolean;
};

export type RatedPlayer = {
  rank: number;
  id: string;
  name: string;
  image: string | null;
  avg: number; // moyenne par match sur la saison
  matches: number; // nombre de matchs notés
  mvp: number; // nombre de fois élu Star du match
  me: boolean;
};

const MIN_RATED_MATCHES = 3;

export async function getLeaderboard(meId: string): Promise<{
  points: Ranked[];
  duelists: Ranked[];
  pronos: Ranked[];
  topRated: RatedPlayer[];
  playerOfMonth: RatedPlayer | null;
  topAttendance: Ranked[];
}> {
  const PLAYER_SEL = {
    pace: true, shooting: true, passing: true,
    dribbling: true, defending: true, physical: true, upgradeLevel: true,
  } as const;

  const [users, duelWins, pronoAgg] = await Promise.all([
    db.user.findMany({
      orderBy: { points: "desc" },
      take: 20,
      select: { id: true, name: true, image: true, points: true, player: { select: PLAYER_SEL } },
    }),
    db.duel.groupBy({
      by: ["winnerId"],
      where: { status: "FINISHED", winnerId: { not: null } },
      _count: { _all: true },
    }),
    db.prediction.groupBy({
      by: ["userId"],
      where: { awardedPoints: { not: null } },
      _sum: { awardedPoints: true },
    }),
  ]);

  const points: Ranked[] = users.map((u, i) => ({
    rank: i + 1,
    id: u.id,
    name: u.name,
    image: u.image,
    value: u.points,
    ovr: u.player ? ovrOf(u.player) : null,
    me: u.id === meId,
  }));

  // Duellistes : top victoires
  const duelTop = duelWins
    .filter((d) => d.winnerId)
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 10);
  const duelNames = await db.user.findMany({
    where: { id: { in: duelTop.map((d) => d.winnerId as string) } },
    select: { id: true, name: true, image: true },
  });
  const duelists: Ranked[] = duelTop.map((d, i) => {
    const u = duelNames.find((x) => x.id === d.winnerId);
    return { rank: i + 1, id: d.winnerId as string, name: u?.name ?? "?", image: u?.image ?? null, value: d._count._all, me: d.winnerId === meId };
  });

  // Pronostiqueurs : total points gagnés
  const pronoTop = pronoAgg
    .map((p) => ({ userId: p.userId, pts: p._sum.awardedPoints ?? 0 }))
    .filter((p) => p.pts > 0)
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 10);
  const pronoNames = await db.user.findMany({
    where: { id: { in: pronoTop.map((p) => p.userId) } },
    select: { id: true, name: true, image: true },
  });
  const pronos: Ranked[] = pronoTop.map((p, i) => {
    const u = pronoNames.find((x) => x.id === p.userId);
    return { rank: i + 1, id: p.userId, name: u?.name ?? "?", image: u?.image ?? null, value: p.pts, me: p.userId === meId };
  });

  // Notes de la saison : moyenne par match (chaque match pèse pareil),
  // réservée aux joueurs notés sur au moins MIN_RATED_MATCHES matchs.
  const [perMatch, mvpAgg] = await Promise.all([
    db.playerRating.groupBy({ by: ["playerId", "matchId"], _avg: { rating: true } }),
    db.matchStat.groupBy({ by: ["playerId"], where: { isMvp: true }, _count: { _all: true } }),
  ]);
  const matchAvgs = new Map<string, number[]>();
  for (const r of perMatch) {
    if (r._avg.rating == null) continue;
    const arr = matchAvgs.get(r.playerId) ?? [];
    arr.push(r._avg.rating);
    matchAvgs.set(r.playerId, arr);
  }
  const mvpCount = new Map(mvpAgg.map((m) => [m.playerId, m._count._all]));
  const ratedRaw = [...matchAvgs.entries()]
    .filter(([, arr]) => arr.length >= MIN_RATED_MATCHES)
    .map(([pid, arr]) => ({ pid, avg: arr.reduce((s, x) => s + x, 0) / arr.length, matches: arr.length }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);
  const ratedPlayers = ratedRaw.length
    ? await db.player.findMany({
        where: { id: { in: ratedRaw.map((r) => r.pid) } },
        select: { id: true, firstName: true, lastName: true, photo: true, userId: true, user: { select: { image: true } } },
      })
    : [];
  const ratedInfo = new Map(ratedPlayers.map((p) => [p.id, p]));
  const topRated: RatedPlayer[] = ratedRaw.map((r, i) => {
    const p = ratedInfo.get(r.pid);
    return {
      rank: i + 1,
      id: r.pid,
      name: p ? `${p.firstName} ${p.lastName}` : "?",
      image: p?.photo ?? p?.user?.image ?? null,
      avg: Math.round(r.avg * 10) / 10,
      matches: r.matches,
      mvp: mvpCount.get(r.pid) ?? 0,
      me: p?.userId === meId,
    };
  });

  // Joueur du mois : meilleure note moyenne sur le mois en cours (≥ 1 match noté).
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthRatings = await db.playerRating.groupBy({
    by: ["playerId", "matchId"],
    where: { createdAt: { gte: monthStart } },
    _avg: { rating: true },
  });
  const monthAvgs = new Map<string, number[]>();
  for (const r of monthRatings) {
    if (r._avg.rating == null) continue;
    const arr = monthAvgs.get(r.playerId) ?? [];
    arr.push(r._avg.rating);
    monthAvgs.set(r.playerId, arr);
  }
  let playerOfMonth: RatedPlayer | null = null;
  if (monthAvgs.size > 0) {
    const best = [...monthAvgs.entries()]
      .map(([pid, arr]) => ({ pid, avg: arr.reduce((s, x) => s + x, 0) / arr.length, matches: arr.length }))
      .sort((a, b) => b.avg - a.avg)[0];
    const pl = await db.player.findUnique({
      where: { id: best.pid },
      select: { id: true, firstName: true, lastName: true, photo: true, userId: true, user: { select: { image: true } } },
    });
    if (pl) {
      playerOfMonth = {
        rank: 1,
        id: best.pid,
        name: `${pl.firstName} ${pl.lastName}`,
        image: pl.photo ?? pl.user?.image ?? null,
        avg: Math.round(best.avg * 10) / 10,
        matches: best.matches,
        mvp: mvpCount.get(best.pid) ?? 0,
        me: pl.userId === meId,
      };
    }
  }

  // Taux de présence aux entraînements (min. 3 séances)
  const [allAtt, playersList] = await Promise.all([
    db.eventAttendance.findMany({
      select: { playerId: true, status: true },
      where: { event: { type: "TRAINING", cancelled: false } },
    }),
    db.player.findMany({
      where: { userId: { not: null } },
      select: { id: true, firstName: true, lastName: true, photo: true, userId: true, user: { select: { image: true } } },
    }),
  ]);
  const attMap = new Map<string, { total: number; present: number }>();
  for (const a of allAtt) {
    const cur = attMap.get(a.playerId) ?? { total: 0, present: 0 };
    cur.total++;
    if (a.status === "PRESENT") cur.present++;
    attMap.set(a.playerId, cur);
  }
  const topAttendance: Ranked[] = playersList
    .filter((p) => {
      const att = attMap.get(p.id);
      return att && att.total >= 3;
    })
    .map((p) => {
      const att = attMap.get(p.id)!;
      return {
        rank: 0,
        id: p.userId!,
        name: `${p.firstName} ${p.lastName}`,
        image: p.photo ?? p.user?.image ?? null,
        value: Math.round((att.present / att.total) * 100),
        me: p.userId === meId,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return { points, duelists, pronos, topRated, playerOfMonth, topAttendance };
}
