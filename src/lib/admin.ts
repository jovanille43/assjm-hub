import { db } from "@/lib/db";

export async function getAdminOverview() {
  const [users, players, teams, posts, matches, news, messages] =
    await Promise.all([
      db.user.count(),
      db.player.count(),
      db.team.count(),
      db.post.count(),
      db.match.count(),
      db.newsArticle.count(),
      db.message.count(),
    ]);
  return { users, players, teams, posts, matches, news, messages };
}

export function getAllUsers() {
  return db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, points: true, image: true },
  });
}

export function getAllNews() {
  return db.newsArticle.findMany({ orderBy: { publishedAt: "desc" } });
}

export function getAllTeams() {
  return db.team.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, category: true, _count: { select: { players: true, matches: true } } },
  });
}

export function getAllPlayers() {
  return db.player.findMany({
    orderBy: [{ team: { name: "asc" } }, { lastName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      position: true,
      number: true,
      teamId: true,
      pace: true,
      shooting: true,
      passing: true,
      dribbling: true,
      defending: true,
      physical: true,
      upgradeLevel: true,
      team: { select: { name: true } },
    },
  });
}
