import { db } from "@/lib/db";

/**
 * Helpers de récupération des données pour la vitrine publique.
 * Chaque fonction est protégée : si la base n'est pas prête, on renvoie un
 * repli vide plutôt que de faire planter le rendu.
 */

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error("[data] requête échouée:", e);
    return fallback;
  }
}

export function getLatestNews(limit = 3) {
  return safe(
    () =>
      db.newsArticle.findMany({
        where: { published: true },
        orderBy: { publishedAt: "desc" },
        take: limit,
      }),
    [],
  );
}

export function getRecentResults(limit = 5) {
  return safe(
    () =>
      db.match.findMany({
        where: { status: "FINISHED" },
        orderBy: { date: "desc" },
        take: limit,
        include: { team: true },
      }),
    [],
  );
}

export function getNextMatch() {
  return safe(
    () =>
      db.match.findFirst({
        where: { status: "SCHEDULED", date: { gte: new Date() } },
        orderBy: { date: "asc" },
        include: { team: true },
      }),
    null,
  );
}

export function getUpcomingMatches(limit = 4) {
  return safe(
    () =>
      db.match.findMany({
        where: { status: "SCHEDULED", date: { gte: new Date() } },
        orderBy: { date: "asc" },
        take: limit,
        include: { team: true },
      }),
    [],
  );
}

export function getStandings(competition?: string) {
  return safe(
    () =>
      db.standing.findMany({
        where: competition ? { competition } : undefined,
        orderBy: { rank: "asc" },
      }),
    [],
  );
}

export function getSponsors() {
  return safe(
    () => db.sponsor.findMany({ orderBy: { order: "asc" } }),
    [],
  );
}

export function getGallery(limit = 6) {
  return safe(
    () =>
      db.galleryItem.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    [],
  );
}

export async function getTopScorers(limit = 3) {
  return safe(async () => {
    const grouped = await db.matchStat.groupBy({
      by: ["playerId"],
      _sum: { goals: true },
      orderBy: { _sum: { goals: "desc" } },
      take: limit,
    });
    const players = await db.player.findMany({
      where: { id: { in: grouped.map((g) => g.playerId) } },
      include: { team: true },
    });
    return grouped
      .map((g) => {
        const player = players.find((p) => p.id === g.playerId);
        return player ? { player, goals: g._sum.goals ?? 0 } : null;
      })
      .filter((x): x is { player: (typeof players)[number]; goals: number } => !!x);
  }, []);
}

export async function getClubStats() {
  return safe(
    async () => {
      const [members, players, teams, matches, goalsAgg] = await Promise.all([
        db.user.count(),
        db.player.count(),
        db.team.count(),
        db.match.count({ where: { status: "FINISHED" } }),
        db.matchStat.aggregate({ _sum: { goals: true } }),
      ]);
      return {
        members,
        players,
        teams,
        matches,
        goals: goalsAgg._sum.goals ?? 0,
      };
    },
    { members: 0, players: 0, teams: 0, matches: 0, goals: 0 },
  );
}
