import { db } from "@/lib/db";
import { resultOf } from "@/lib/enums";

export type RankedPlayer = {
  id: string;
  firstName: string;
  lastName: string;
  team: string | null;
  value: number;
};

async function attachPlayers(
  grouped: { playerId: string; value: number }[],
): Promise<RankedPlayer[]> {
  const players = await db.player.findMany({
    where: { id: { in: grouped.map((g) => g.playerId) } },
    include: { team: true },
  });
  return grouped
    .map((g) => {
      const p = players.find((x) => x.id === g.playerId);
      if (!p) return null;
      return {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        team: p.team?.name ?? null,
        value: g.value,
      };
    })
    .filter((x): x is RankedPlayer => x !== null);
}

export async function getTopScorers(limit = 8): Promise<RankedPlayer[]> {
  const grouped = await db.matchStat.groupBy({
    by: ["playerId"],
    where: { goals: { gt: 0 } },
    _sum: { goals: true },
    orderBy: { _sum: { goals: "desc" } },
    take: limit,
  });
  return attachPlayers(grouped.map((g) => ({ playerId: g.playerId, value: g._sum.goals ?? 0 })));
}

export async function getTopAssists(limit = 8): Promise<RankedPlayer[]> {
  const grouped = await db.matchStat.groupBy({
    by: ["playerId"],
    where: { assists: { gt: 0 } },
    _sum: { assists: true },
    orderBy: { _sum: { assists: "desc" } },
    take: limit,
  });
  return attachPlayers(grouped.map((g) => ({ playerId: g.playerId, value: g._sum.assists ?? 0 })));
}

export async function getTopAttendance(limit = 8): Promise<RankedPlayer[]> {
  const grouped = await db.matchStat.groupBy({
    by: ["playerId"],
    _count: { _all: true },
    orderBy: { _count: { playerId: "desc" } },
    take: limit,
  });
  return attachPlayers(
    grouped.map((g) => ({ playerId: g.playerId, value: g._count._all })),
  );
}

export type FairplayPlayer = RankedPlayer & { yellow: number; red: number };

export async function getTopFairplay(limit = 12): Promise<FairplayPlayer[]> {
  const grouped = await db.matchStat.groupBy({
    by: ["playerId"],
    where: { OR: [{ yellow: { gt: 0 } }, { red: { gt: 0 } }] },
    _sum: { yellow: true, red: true },
    orderBy: [{ _sum: { red: "desc" } }, { _sum: { yellow: "desc" } }],
    take: limit,
  });
  const players = await db.player.findMany({
    where: { id: { in: grouped.map((g) => g.playerId) } },
    include: { team: true },
  });
  return grouped
    .map((g) => {
      const p = players.find((x) => x.id === g.playerId);
      if (!p) return null;
      const yellow = g._sum.yellow ?? 0;
      const red = g._sum.red ?? 0;
      return {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        team: p.team?.name ?? null,
        value: yellow + red * 3,
        yellow,
        red,
      };
    })
    .filter((x): x is FairplayPlayer => x !== null);
}

export async function getClubForm(limit = 5) {
  const matches = await db.match.findMany({
    where: { status: "FINISHED" },
    orderBy: { date: "desc" },
    take: limit,
    include: { team: true },
  });
  return matches
    .map((m) => ({
      id: m.id,
      opponent: m.opponent,
      scoreFor: m.scoreFor,
      scoreAgainst: m.scoreAgainst,
      result: resultOf(m.scoreFor, m.scoreAgainst),
    }))
    .reverse();
}
