import { db } from "@/lib/db";

/** Convocations du joueur connecté pour les matchs à venir + entraînements de son équipe. */
export async function getPlayerConvocations(userId: string) {
  const player = await db.player.findUnique({
    where: { userId },
    select: { id: true, teamId: true },
  });
  if (!player) return { player: null, convocations: [], trainings: [] };

  const now = new Date();

  const convocations = await db.convocation.findMany({
    where: {
      playerId: player.id,
      match: { status: "SCHEDULED", date: { gte: now } },
    },
    include: {
      match: {
        include: {
          team: true,
          convocations: {
            include: {
              player: {
                select: { id: true, firstName: true, lastName: true, number: true },
              },
            },
            orderBy: { player: { lastName: "asc" } },
          },
          lineup: {
            select: {
              formation: true,
              slots: { where: { playerId: player.id }, select: { role: true } },
            },
          },
        },
      },
    },
    orderBy: { match: { date: "asc" } },
  });

  const [trainingEvents, teamPlayers] = await Promise.all([
    player.teamId
      ? db.event.findMany({
          where: {
            teamId: player.teamId,
            type: "TRAINING",
            cancelled: false,
            start: { gte: now },
          },
          orderBy: { start: "asc" },
          take: 6,
        })
      : Promise.resolve([]),
    player.teamId
      ? db.player.findMany({
          where: { teamId: player.teamId },
          select: { id: true, firstName: true, lastName: true, number: true },
          orderBy: [{ number: "asc" }, { lastName: "asc" }],
        })
      : Promise.resolve([]),
  ]);

  // Toutes les présences déclarées pour ces entraînements (tous les joueurs)
  const allAttendances =
    trainingEvents.length > 0
      ? await db.eventAttendance.findMany({
          where: { eventId: { in: trainingEvents.map((e) => e.id) } },
          select: { eventId: true, playerId: true, status: true },
        })
      : [];

  // Map : eventId → (playerId → status)
  const eventAttMap = new Map<string, Map<string, string>>();
  for (const a of allAttendances) {
    if (!eventAttMap.has(a.eventId)) eventAttMap.set(a.eventId, new Map());
    eventAttMap.get(a.eventId)!.set(a.playerId, a.status);
  }

  const trainings = trainingEvents.map((t) => {
    const byPlayer = eventAttMap.get(t.id) ?? new Map<string, string>();
    return {
      ...t,
      attendance: byPlayer.get(player.id) ?? null,
      roster: teamPlayers.map((p) => ({
        player: p,
        status: byPlayer.get(p.id) ?? null,
      })),
    };
  });

  return { player, convocations, trainings };
}

/** Matchs à venir (pour la sélection côté staff). */
export function getUpcomingMatchesStaff() {
  return db.match.findMany({
    where: { status: "SCHEDULED", date: { gte: new Date() } },
    orderBy: { date: "asc" },
    include: { team: true, _count: { select: { convocations: true } } },
  });
}

/** Effectif + état des convocations pour un match (vue coach). */
export async function getMatchConvocations(matchId: string) {
  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      team: { include: { players: { orderBy: [{ number: "asc" }] } } },
      convocations: true,
    },
  });
  if (!match) return null;

  const convMap = new Map(match.convocations.map((c) => [c.playerId, c]));
  const roster = match.team.players.map((p) => ({
    player: p,
    convocation: convMap.get(p.id) ?? null,
  }));
  const accepted = match.convocations.filter((c) => c.status === "ACCEPTED").length;
  const declined = match.convocations.filter((c) => c.status === "DECLINED").length;
  const pending = match.convocations.filter((c) => c.status === "PENDING").length;
  const uncertain = match.convocations.filter((c) => c.status === "UNCERTAIN").length;

  return { match, roster, accepted, declined, pending, uncertain };
}
