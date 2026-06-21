"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { scorePrediction } from "@/lib/pronos";
import { notify } from "@/lib/notifications";

const STAFF_ROLES = ["ADMIN", "DIRIGEANT", "COACH"];

export type UpcomingMatch = {
  id: string;
  opponent: string;
  venue: string;
  competition: string | null;
  teamName: string;
  date: string;
  myPred: { predFor: number; predAgainst: number; boosted: boolean } | null;
};

export type ResolvedPrediction = {
  id: string;
  opponent: string;
  date: string;
  scoreFor: number;
  scoreAgainst: number;
  predFor: number;
  predAgainst: number;
  boosted: boolean;
  awardedPoints: number;
};

export type AwaitingMatch = {
  id: string;
  opponent: string;
  teamName: string;
  date: string;
};

/** Attribue les points des pronostics dont le match est terminé (idempotent). */
export async function resolvePredictions(matchId?: string): Promise<void> {
  const finished = await db.match.findMany({
    where: {
      status: "FINISHED",
      scoreFor: { not: null },
      scoreAgainst: { not: null },
      ...(matchId ? { id: matchId } : {}),
    },
    select: { id: true, scoreFor: true, scoreAgainst: true, opponent: true },
  });
  if (finished.length === 0) return;

  const byId = new Map(finished.map((m) => [m.id, m]));
  const preds = await db.prediction.findMany({
    where: { matchId: { in: finished.map((m) => m.id) }, awardedPoints: null },
  });

  for (const p of preds) {
    const m = byId.get(p.matchId);
    if (!m || m.scoreFor == null || m.scoreAgainst == null) continue;
    let pts = scorePrediction(p.predFor, p.predAgainst, m.scoreFor, m.scoreAgainst);
    if (p.boosted) pts *= 2;
    await db.$transaction([
      db.prediction.update({ where: { id: p.id }, data: { awardedPoints: pts } }),
      ...(pts > 0
        ? [db.user.update({ where: { id: p.userId }, data: { points: { increment: pts } } })]
        : []),
    ]);
    await notify(p.userId, {
      type: "PRONO",
      title: pts > 0 ? `Pronostic gagné : +${pts} pts 🎯` : "Pronostic terminé",
      body: `ASSJM ${m.scoreFor}–${m.scoreAgainst} ${m.opponent} (ton prono : ${p.predFor}–${p.predAgainst}).`,
      link: "/dashboard/pronos",
    });
  }
}

export async function getPronoData(): Promise<{
  myPoints: number;
  myBoosts: number;
  isStaff: boolean;
  upcoming: UpcomingMatch[];
  resolved: ResolvedPrediction[];
  awaiting: AwaitingMatch[];
}> {
  const empty = { myPoints: 0, myBoosts: 0, isStaff: false, upcoming: [], resolved: [], awaiting: [] };
  const session = await auth();
  if (!session?.user) return empty;
  const me = session.user.id;
  const isStaff = STAFF_ROLES.includes(session.user.role ?? "");

  // Régler les pronos en attente avant de lire.
  await resolvePredictions();

  const now = new Date();
  const meUser = await db.user.findUnique({
    where: { id: me },
    select: { points: true, pronoBoosts: true },
  });
  if (!meUser) return empty;

  const [matches, myPreds, resolvedPreds, awaitingMatches] = await Promise.all([
    db.match.findMany({
      where: { status: "SCHEDULED", date: { gt: now } },
      orderBy: { date: "asc" },
      take: 10,
      include: { team: { select: { name: true } } },
    }),
    db.prediction.findMany({ where: { userId: me } }),
    db.prediction.findMany({
      where: { userId: me, awardedPoints: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { match: { select: { opponent: true, date: true, scoreFor: true, scoreAgainst: true } } },
    }),
    isStaff
      ? db.match.findMany({
          where: { status: { in: ["SCHEDULED", "LIVE"] }, date: { lte: now } },
          orderBy: { date: "desc" },
          take: 10,
          include: { team: { select: { name: true } } },
        })
      : Promise.resolve([]),
  ]);

  const predByMatch = new Map(myPreds.map((p) => [p.matchId, p]));

  const upcoming: UpcomingMatch[] = matches.map((m) => {
    const p = predByMatch.get(m.id);
    return {
      id: m.id,
      opponent: m.opponent,
      venue: m.venue,
      competition: m.competition,
      teamName: m.team.name,
      date: m.date.toISOString(),
      myPred: p ? { predFor: p.predFor, predAgainst: p.predAgainst, boosted: p.boosted } : null,
    };
  });

  const resolved: ResolvedPrediction[] = resolvedPreds
    .filter((p) => p.match.scoreFor != null && p.match.scoreAgainst != null)
    .map((p) => ({
      id: p.id,
      opponent: p.match.opponent,
      date: p.match.date.toISOString(),
      scoreFor: p.match.scoreFor as number,
      scoreAgainst: p.match.scoreAgainst as number,
      predFor: p.predFor,
      predAgainst: p.predAgainst,
      boosted: p.boosted,
      awardedPoints: p.awardedPoints as number,
    }));

  const awaiting: AwaitingMatch[] = (awaitingMatches as typeof matches).map((m) => ({
    id: m.id,
    opponent: m.opponent,
    teamName: m.team.name,
    date: m.date.toISOString(),
  }));

  return { myPoints: meUser.points, myBoosts: meUser.pronoBoosts, isStaff, upcoming, resolved, awaiting };
}

export async function submitPrediction(input: {
  matchId: string;
  predFor: number;
  predAgainst: number;
  useBoost: boolean;
}): Promise<{ error?: string; ok?: boolean; boostUsed?: boolean }> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };
  const me = session.user.id;

  const f = Math.round(input.predFor);
  const a = Math.round(input.predAgainst);
  if (!Number.isInteger(f) || !Number.isInteger(a) || f < 0 || a < 0 || f > 30 || a > 30) {
    return { error: "Score invalide." };
  }

  const match = await db.match.findUnique({ where: { id: input.matchId } });
  if (!match) return { error: "Match introuvable." };
  if (match.status !== "SCHEDULED" || match.date.getTime() <= Date.now()) {
    return { error: "Les pronostics pour ce match sont fermés." };
  }

  const existing = await db.prediction.findUnique({
    where: { userId_matchId: { userId: me, matchId: input.matchId } },
  });

  let boosted = existing?.boosted ?? false;
  let consumeBoost = false;
  if (!boosted && input.useBoost) {
    const u = await db.user.findUnique({ where: { id: me }, select: { pronoBoosts: true } });
    if ((u?.pronoBoosts ?? 0) < 1) return { error: "Tu n'as aucun boost Prono ×2." };
    boosted = true;
    consumeBoost = true;
  }

  const ops: any[] = [
    db.prediction.upsert({
      where: { userId_matchId: { userId: me, matchId: input.matchId } },
      create: { userId: me, matchId: input.matchId, predFor: f, predAgainst: a, boosted },
      update: { predFor: f, predAgainst: a, boosted },
    }),
  ];
  if (consumeBoost) {
    ops.push(db.user.update({ where: { id: me }, data: { pronoBoosts: { decrement: 1 } } }));
  }
  await db.$transaction(ops);

  revalidatePath("/dashboard/pronos");
  revalidatePath("/dashboard");
  return { ok: true, boostUsed: consumeBoost };
}

export async function setMatchResult(input: {
  matchId: string;
  scoreFor: number;
  scoreAgainst: number;
}): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };
  if (!STAFF_ROLES.includes(session.user.role ?? "")) return { error: "Réservé au staff." };

  const f = Math.round(input.scoreFor);
  const a = Math.round(input.scoreAgainst);
  if (!Number.isInteger(f) || !Number.isInteger(a) || f < 0 || a < 0 || f > 30 || a > 30) {
    return { error: "Score invalide." };
  }

  await db.match.update({
    where: { id: input.matchId },
    data: { scoreFor: f, scoreAgainst: a, status: "FINISHED" },
  });

  await resolvePredictions(input.matchId);

  revalidatePath("/dashboard/pronos");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  revalidatePath("/calendrier");
  return { ok: true };
}
