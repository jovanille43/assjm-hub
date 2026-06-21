import { db } from "@/lib/db";
import { notify } from "@/lib/notifications";
import { syncBadges } from "@/lib/badges";

export const SDM_WINDOW_H = 48;
const STAFF_ROLES = ["ADMIN", "DIRIGEANT", "COACH"];

export function sdmDeadline(matchDate: Date): Date {
  return new Date(new Date(matchDate).getTime() + SDM_WINDOW_H * 3600_000);
}

/**
 * Clôture du vote Star du match : si la fenêtre est passée et qu'aucun MVP n'est
 * encore désigné, le joueur le plus voté devient l'homme du match (MatchStat.isMvp)
 * → badge « capitaine » + notification. Idempotent.
 */
export async function closeSdmIfDue(matchId: string): Promise<void> {
  const match = await db.match.findUnique({
    where: { id: matchId },
    select: { id: true, date: true, status: true },
  });
  if (!match || match.status !== "FINISHED") return;
  if (new Date() <= sdmDeadline(match.date)) return; // encore ouvert

  const already = await db.matchStat.findFirst({ where: { matchId, isMvp: true }, select: { id: true } });
  if (already) return; // déjà résolu

  const votes = await db.vote.findMany({ where: { matchId, type: "MVP" }, select: { targetId: true } });
  if (votes.length === 0) return;

  const counts = new Map<string, number>();
  for (const v of votes) counts.set(v.targetId, (counts.get(v.targetId) ?? 0) + 1);
  let winner = "";
  let best = -1;
  for (const [pid, n] of counts) if (n > best) { best = n; winner = pid; }
  if (!winner) return;

  await db.matchStat.upsert({
    where: { matchId_playerId: { matchId, playerId: winner } },
    create: { matchId, playerId: winner, isMvp: true, minutes: 90, started: true },
    update: { isMvp: true },
  });

  const player = await db.player.findUnique({ where: { id: winner }, select: { userId: true, firstName: true, lastName: true } });
  if (player?.userId) {
    await notify(player.userId, {
      type: "BADGE",
      title: "Tu es élu Star du match ! ⭐",
      body: `Les votes de l'équipe t'ont désigné homme du match (${best} vote${best > 1 ? "s" : ""}).`,
      link: "/dashboard",
    });
    await syncBadges(player.userId).catch(() => {});
  }
}

export type PostMatchPlayer = {
  id: string;
  name: string;
  number: number | null;
  votes: number;
  ratingAvg: number | null;
  ratingCount: number;
  myRating: number | null;
  isSelf: boolean;
};

export async function getPostMatch(matchId: string, viewerId: string, viewerRole: string) {
  await closeSdmIfDue(matchId);

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      team: {
        select: {
          name: true,
          players: {
            orderBy: [{ number: "asc" }],
            select: { id: true, firstName: true, lastName: true, number: true, userId: true },
          },
        },
      },
    },
  });
  if (!match) return null;

  const [votes, myVote, ratings, myRatings, awards] = await Promise.all([
    db.vote.findMany({ where: { matchId, type: "MVP" }, select: { targetId: true } }),
    db.vote.findFirst({ where: { matchId, type: "MVP", userId: viewerId }, select: { targetId: true } }),
    db.playerRating.groupBy({ by: ["playerId"], where: { matchId }, _avg: { rating: true }, _count: { _all: true } }),
    db.playerRating.findMany({ where: { matchId, raterUserId: viewerId }, select: { playerId: true, rating: true } }),
    db.matchAward.findMany({
      where: { matchId },
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { votes: true } },
        votes: { where: { userId: viewerId }, select: { id: true } },
      },
    }),
  ]);

  const voteCount = new Map<string, number>();
  for (const v of votes) voteCount.set(v.targetId, (voteCount.get(v.targetId) ?? 0) + 1);
  const avgMap = new Map(ratings.map((r) => [r.playerId, { avg: r._avg.rating, count: r._count._all }]));
  const myRatingMap = new Map(myRatings.map((r) => [r.playerId, r.rating]));

  const isStaff = STAFF_ROLES.includes(viewerRole);
  const now = new Date();
  const deadline = sdmDeadline(match.date);
  const finished = match.status === "FINISHED";
  const withinWindow = finished && now <= deadline;
  const closed = finished && now > deadline;
  const canParticipate =
    withinWindow && match.votingMode !== "OFF" && (match.votingMode === "ALL" || isStaff);

  const players: PostMatchPlayer[] = match.team.players.map((p) => {
    const r = avgMap.get(p.id);
    return {
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      number: p.number,
      votes: voteCount.get(p.id) ?? 0,
      ratingAvg: r?.avg != null ? Math.round(r.avg * 10) / 10 : null,
      ratingCount: r?.count ?? 0,
      myRating: myRatingMap.get(p.id) ?? null,
      isSelf: p.userId === viewerId,
    };
  });

  const playerName = new Map(match.team.players.map((p) => [p.id, `${p.firstName} ${p.lastName}`]));

  // Titres : on résout les noms des proposeurs (jamais l'identité des votants).
  const proposerIds = [...new Set(awards.map((a) => a.proposedById).filter((x): x is string => !!x))];
  const proposers = proposerIds.length
    ? await db.user.findMany({ where: { id: { in: proposerIds } }, select: { id: true, name: true } })
    : [];
  const proposerName = new Map(proposers.map((u) => [u.id, u.name]));

  const awardsOut = awards
    .map((a) => ({
      id: a.id,
      playerId: a.playerId,
      title: a.title,
      playerName: playerName.get(a.playerId) ?? "?",
      votes: a._count.votes,
      mine: a.votes.length > 0,
      proposedByName: a.proposedById ? proposerName.get(a.proposedById) ?? null : null,
      canRemove: isStaff || a.proposedById === viewerId,
    }))
    .sort((x, y) => y.votes - x.votes);

  return {
    match: {
      id: match.id,
      opponent: match.opponent,
      venue: match.venue,
      date: match.date.toISOString(),
      status: match.status,
      scoreFor: match.scoreFor,
      scoreAgainst: match.scoreAgainst,
      report: match.report,
      teamName: match.team.name,
      votingMode: match.votingMode,
    },
    isStaff,
    finished,
    canParticipate,
    closed,
    deadline: deadline.toISOString(),
    squadSize: match.team.players.length,
    players,
    myVote: myVote?.targetId ?? null,
    totalVotes: votes.length,
    awards: awardsOut,
  };
}

/**
 * Trouve un vote Star du match encore ouvert et NON voté par l'utilisateur
 * (pour la carte d'appel à l'action sur le tableau de bord). null sinon.
 */
export async function getOpenSdmVote(userId: string, role: string) {
  const isStaff = STAFF_ROLES.includes(role);
  const now = new Date();
  const since = new Date(now.getTime() - SDM_WINDOW_H * 3600_000);
  const match = await db.match.findFirst({
    where: { status: "FINISHED", votingMode: { not: "OFF" }, date: { gt: since } },
    orderBy: { date: "desc" },
    select: {
      id: true, opponent: true, date: true, votingMode: true,
      scoreFor: true, scoreAgainst: true, team: { select: { name: true } },
    },
  });
  if (!match) return null;
  if (match.votingMode === "STAFF" && !isStaff) return null;

  const voted = await db.vote.findFirst({
    where: { matchId: match.id, type: "MVP", userId },
    select: { id: true },
  });
  if (voted) return null; // déjà voté → pas de relance

  return {
    matchId: match.id,
    opponent: match.opponent,
    teamName: match.team.name,
    scoreFor: match.scoreFor,
    scoreAgainst: match.scoreAgainst,
    deadline: sdmDeadline(match.date).toISOString(),
  };
}
