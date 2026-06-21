import { db } from "@/lib/db";

export type Candidate = {
  id: string;
  firstName: string;
  lastName: string;
  team: string | null;
  votes: number;
};

export function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Contexte du vote MVP : dernier match terminé + candidats (joueurs alignés). */
export async function getMvpContext(userId: string) {
  const match = await db.match.findFirst({
    where: { status: "FINISHED" },
    orderBy: { date: "desc" },
    include: {
      team: true,
      stats: { include: { player: { include: { team: true } } } },
    },
  });
  if (!match) return null;

  const votes = await db.vote.findMany({
    where: { type: "MVP", matchId: match.id },
  });
  const tally = new Map<string, number>();
  votes.forEach((v) => tally.set(v.targetId, (tally.get(v.targetId) ?? 0) + 1));

  const candidates: Candidate[] = match.stats
    .map((s) => ({
      id: s.player.id,
      firstName: s.player.firstName,
      lastName: s.player.lastName,
      team: s.player.team?.name ?? null,
      votes: tally.get(s.player.id) ?? 0,
    }))
    .sort((a, b) => b.votes - a.votes);

  return {
    match,
    candidates,
    totalVotes: votes.length,
    myVote: votes.find((v) => v.userId === userId)?.targetId ?? null,
  };
}

/** Contexte du vote Joueur du mois (période en cours). */
export async function getPotmContext(userId: string) {
  const period = currentPeriod();
  const [players, votes] = await Promise.all([
    db.player.findMany({
      where: { teamId: { not: null } },
      include: { team: true },
      orderBy: [{ number: "asc" }],
    }),
    db.vote.findMany({ where: { type: "PLAYER_OF_MONTH", period } }),
  ]);

  const tally = new Map<string, number>();
  votes.forEach((v) => tally.set(v.targetId, (tally.get(v.targetId) ?? 0) + 1));

  const candidates: Candidate[] = players
    .map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      team: p.team?.name ?? null,
      votes: tally.get(p.id) ?? 0,
    }))
    .sort((a, b) => b.votes - a.votes);

  return {
    period,
    candidates,
    totalVotes: votes.length,
    myVote: votes.find((v) => v.userId === userId)?.targetId ?? null,
  };
}
