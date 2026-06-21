import { db } from "@/lib/db";

function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export type LeagueRow = {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  totalPts: number;
  played: number;
  perfect: number; // score exact
  me: boolean;
};

export type Journee = {
  weekKey: string; // "2026-W12"
  startDate: string; // ISO date du premier match de la semaine
  opponents: string[]; // adversaires joués cette semaine
  rows: LeagueRow[];
};

export async function getLeagueData(meId: string): Promise<{
  season: LeagueRow[];
  journees: Journee[];
  myRank: number | null;
}> {
  const resolved = await db.prediction.findMany({
    where: { awardedPoints: { not: null } },
    select: {
      userId: true,
      awardedPoints: true,
      predFor: true,
      predAgainst: true,
      match: { select: { date: true, opponent: true, scoreFor: true, scoreAgainst: true } },
      user: { select: { id: true, name: true, image: true } },
    },
  });

  type PEntry = { user: { id: string; name: string; image: string | null }; pts: number; played: number; perfect: number };

  // Season totals
  const seasonMap = new Map<string, PEntry>();
  for (const p of resolved) {
    const e = seasonMap.get(p.userId) ?? { user: p.user, pts: 0, played: 0, perfect: 0 };
    e.pts += p.awardedPoints ?? 0;
    e.played++;
    if (p.predFor === p.match.scoreFor && p.predAgainst === p.match.scoreAgainst) e.perfect++;
    seasonMap.set(p.userId, e);
  }

  const season: LeagueRow[] = [...seasonMap.entries()]
    .sort((a, b) => b[1].pts - a[1].pts || b[1].perfect - a[1].perfect)
    .map(([uid, d], i) => ({
      rank: i + 1,
      userId: uid,
      name: d.user.name,
      image: d.user.image,
      totalPts: d.pts,
      played: d.played,
      perfect: d.perfect,
      me: uid === meId,
    }));

  // Group by ISO week
  const byWeek = new Map<string, typeof resolved>();
  for (const p of resolved) {
    const key = isoWeek(p.match.date);
    const arr = byWeek.get(key) ?? [];
    arr.push(p);
    byWeek.set(key, arr);
  }

  const journees: Journee[] = [...byWeek.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([weekKey, preds]) => {
      const wMap = new Map<string, PEntry>();
      for (const p of preds) {
        const e = wMap.get(p.userId) ?? { user: p.user, pts: 0, played: 0, perfect: 0 };
        e.pts += p.awardedPoints ?? 0;
        e.played++;
        if (p.predFor === p.match.scoreFor && p.predAgainst === p.match.scoreAgainst) e.perfect++;
        wMap.set(p.userId, e);
      }
      const rows: LeagueRow[] = [...wMap.entries()]
        .sort((a, b) => b[1].pts - a[1].pts || b[1].perfect - a[1].perfect)
        .map(([uid, d], i) => ({
          rank: i + 1,
          userId: uid,
          name: d.user.name,
          image: d.user.image,
          totalPts: d.pts,
          played: d.played,
          perfect: d.perfect,
          me: uid === meId,
        }));
      const opponents = [...new Set(preds.map((p) => p.match.opponent))];
      const startDate = preds
        .reduce((min, p) => (p.match.date < min ? p.match.date : min), preds[0].match.date)
        .toISOString();
      return { weekKey, startDate, opponents, rows };
    });

  const myRank = season.find((r) => r.me)?.rank ?? null;

  return { season, journees, myRank };
}
