"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  type CardStats,
  DEFAULT_CARD,
  isValidPlay,
  parseZones,
  scoreShootout,
  serializeZones,
} from "@/lib/duels";
import { notify } from "@/lib/notifications";

const VALID_STAKES = [0, 20, 50];
const WIN_BONUS = 10; // points offerts au vainqueur, en plus du pot
const DRAW_BONUS = 3;

const PLAYER_SELECT = {
  shooting: true,
  pace: true,
  defending: true,
  physical: true,
  position: true,
  upgradeLevel: true,
} as const;

function toCard(p: {
  shooting: number;
  pace: number;
  defending: number;
  physical: number;
  position: string;
  upgradeLevel: number;
} | null): CardStats {
  if (!p) return DEFAULT_CARD;
  return {
    shooting: p.shooting,
    pace: p.pace,
    defending: p.defending,
    physical: p.physical,
    position: p.position,
    upgradeLevel: p.upgradeLevel,
  };
}

function ovrOf(c: CardStats): number {
  const bonus = [0, 3, 6, 10][c.upgradeLevel] ?? 0;
  const avg = (c.shooting + c.pace + c.defending + c.physical) / 4 + bonus;
  return Math.round(avg);
}

async function cardFor(userId: string): Promise<CardStats> {
  const player = await db.player.findUnique({ where: { userId }, select: PLAYER_SELECT });
  return toCard(player);
}

export type Opponent = { id: string; name: string; role: string; ovr: number };

export type DuelSummary = {
  id: string;
  opponentName: string;
  stake: number;
  myGoals: number | null;
  theirGoals: number | null;
  outcome: "WIN" | "LOSS" | "DRAW" | "PENDING";
  iAmChallenger: boolean;
  createdAt: string;
};

export async function getDuelData(): Promise<{
  myPoints: number;
  opponents: Opponent[];
  incoming: DuelSummary[];
  outgoing: DuelSummary[];
  history: DuelSummary[];
}> {
  const empty = { myPoints: 0, opponents: [], incoming: [], outgoing: [], history: [] };
  const session = await auth();
  if (!session?.user) return empty;
  const me = session.user.id;

  const meUser = await db.user.findUnique({ where: { id: me }, select: { points: true } });
  if (!meUser) return empty;

  const [users, duels] = await Promise.all([
    db.user.findMany({
      where: { id: { not: me } },
      select: { id: true, name: true, role: true, player: { select: PLAYER_SELECT } },
      orderBy: { name: "asc" },
    }),
    db.duel.findMany({
      where: { OR: [{ challengerId: me }, { opponentId: me }] },
      orderBy: { createdAt: "desc" },
      include: {
        challenger: { select: { name: true } },
        opponent: { select: { name: true } },
      },
      take: 60,
    }),
  ]);

  const opponents: Opponent[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    ovr: ovrOf(toCard(u.player)),
  }));

  const toSummary = (d: (typeof duels)[number]): DuelSummary => {
    const iAmChallenger = d.challengerId === me;
    const myGoals = iAmChallenger ? d.challengerGoals : d.opponentGoals;
    const theirGoals = iAmChallenger ? d.opponentGoals : d.challengerGoals;
    let outcome: DuelSummary["outcome"] = "PENDING";
    if (d.status === "FINISHED") {
      if (d.winnerId === me) outcome = "WIN";
      else if (d.winnerId === null) outcome = "DRAW";
      else outcome = "LOSS";
    }
    return {
      id: d.id,
      opponentName: iAmChallenger ? d.opponent.name : d.challenger.name,
      stake: d.stake,
      myGoals,
      theirGoals,
      outcome,
      iAmChallenger,
      createdAt: d.createdAt.toISOString(),
    };
  };

  const incoming = duels
    .filter((d) => d.status === "PENDING" && d.opponentId === me)
    .map(toSummary);
  const outgoing = duels
    .filter((d) => d.status === "PENDING" && d.challengerId === me)
    .map(toSummary);
  const history = duels
    .filter((d) => d.status === "FINISHED")
    .slice(0, 15)
    .map(toSummary);

  return { myPoints: meUser.points, opponents, incoming, outgoing, history };
}

export async function createDuel(input: {
  opponentId: string;
  stake: number;
  shots: number[];
  dives: number[];
}): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };
  const me = session.user.id;

  if (input.opponentId === me) return { error: "Tu ne peux pas te défier toi-même." };
  if (!VALID_STAKES.includes(input.stake)) return { error: "Mise invalide." };
  if (!isValidPlay(input.shots) || !isValidPlay(input.dives)) {
    return { error: "Choisis tes 5 tirs et tes 5 plongeons." };
  }

  const [meUser, opp] = await Promise.all([
    db.user.findUnique({ where: { id: me }, select: { points: true, name: true } }),
    db.user.findUnique({ where: { id: input.opponentId }, select: { id: true } }),
  ]);
  if (!meUser) return { error: "Compte introuvable." };
  if (!opp) return { error: "Adversaire introuvable." };
  if (meUser.points < input.stake) {
    return { error: `Mise trop élevée : tu as ${meUser.points} pts.` };
  }

  await db.$transaction([
    db.user.update({ where: { id: me }, data: { points: { decrement: input.stake } } }),
    db.duel.create({
      data: {
        challengerId: me,
        opponentId: input.opponentId,
        stake: input.stake,
        challengerShots: serializeZones(input.shots),
        challengerDives: serializeZones(input.dives),
        status: "PENDING",
      },
    }),
  ]);

  await notify(input.opponentId, {
    type: "DUEL",
    title: "Nouveau défi de pénaltys !",
    body: `${meUser.name} te défie${input.stake > 0 ? ` (mise ${input.stake} pts)` : ""}.`,
    link: "/dashboard/duels",
  });

  revalidatePath("/dashboard/duels");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function playDuel(input: {
  duelId: string;
  shots: number[];
  dives: number[];
}): Promise<{ error?: string; result?: DuelSummary }> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };
  const me = session.user.id;

  if (!isValidPlay(input.shots) || !isValidPlay(input.dives)) {
    return { error: "Choisis tes 5 tirs et tes 5 plongeons." };
  }

  const duel = await db.duel.findUnique({ where: { id: input.duelId } });
  if (!duel) return { error: "Duel introuvable." };
  if (duel.opponentId !== me) return { error: "Ce duel ne t'est pas destiné." };
  if (duel.status !== "PENDING") return { error: "Ce duel est déjà terminé." };

  const meUser = await db.user.findUnique({ where: { id: me }, select: { points: true, name: true } });
  if (!meUser) return { error: "Compte introuvable." };
  if (meUser.points < duel.stake) {
    return { error: `Il te faut ${duel.stake} pts pour relever ce défi.` };
  }

  const [challengerCard, opponentCard] = await Promise.all([
    cardFor(duel.challengerId),
    cardFor(me),
  ]);

  const challengerShots = parseZones(duel.challengerShots);
  const challengerDives = parseZones(duel.challengerDives);

  // Tirs du challenger contre les plongeons de l'adversaire (moi).
  const challengerResults = scoreShootout(challengerShots, input.dives, challengerCard, opponentCard);
  // Mes tirs contre les plongeons du challenger.
  const opponentResults = scoreShootout(input.shots, challengerDives, opponentCard, challengerCard);

  const challengerGoals = challengerResults.filter(Boolean).length;
  const opponentGoals = opponentResults.filter(Boolean).length;

  let winnerId: string | null = null;
  if (challengerGoals > opponentGoals) winnerId = duel.challengerId;
  else if (opponentGoals > challengerGoals) winnerId = me;

  const stake = duel.stake;
  const pot = stake * 2;

  const ops = [];
  // L'adversaire (moi) paie sa mise maintenant.
  if (stake > 0) ops.push(db.user.update({ where: { id: me }, data: { points: { decrement: stake } } }));

  if (winnerId === null) {
    // Nul : on rembourse les deux mises + petit bonus de participation.
    if (stake > 0) {
      ops.push(db.user.update({ where: { id: duel.challengerId }, data: { points: { increment: stake } } }));
      ops.push(db.user.update({ where: { id: me }, data: { points: { increment: stake } } }));
    }
    ops.push(db.user.update({ where: { id: duel.challengerId }, data: { points: { increment: DRAW_BONUS } } }));
    ops.push(db.user.update({ where: { id: me }, data: { points: { increment: DRAW_BONUS } } }));
  } else {
    // Le vainqueur encaisse le pot + un bonus.
    ops.push(db.user.update({ where: { id: winnerId }, data: { points: { increment: pot + WIN_BONUS } } }));
  }

  ops.push(
    db.duel.update({
      where: { id: duel.id },
      data: {
        opponentShots: serializeZones(input.shots),
        opponentDives: serializeZones(input.dives),
        challengerGoals,
        opponentGoals,
        winnerId,
        status: "FINISHED",
        resolvedAt: new Date(),
      },
    }),
  );

  await db.$transaction(ops);

  // Notifie le challenger du résultat (de son point de vue).
  const challengerOutcome =
    winnerId === duel.challengerId ? "Victoire 🏆" : winnerId === null ? "Match nul 🤝" : "Défaite";
  await notify(duel.challengerId, {
    type: "DUEL",
    title: `Duel relevé par ${meUser.name}`,
    body: `${challengerOutcome} — ${challengerGoals}–${opponentGoals}.`,
    link: "/dashboard/duels",
  });

  revalidatePath("/dashboard/duels");
  revalidatePath("/dashboard");

  const outcome: DuelSummary["outcome"] =
    winnerId === me ? "WIN" : winnerId === null ? "DRAW" : "LOSS";

  return {
    result: {
      id: duel.id,
      opponentName: "",
      stake,
      myGoals: opponentGoals,
      theirGoals: challengerGoals,
      outcome,
      iAmChallenger: false,
      createdAt: new Date().toISOString(),
    },
  };
}

export async function declineDuel(duelId: string): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };
  const me = session.user.id;

  const duel = await db.duel.findUnique({ where: { id: duelId } });
  if (!duel) return { error: "Duel introuvable." };
  if (duel.status !== "PENDING") return { error: "Duel déjà traité." };
  // Le destinataire peut refuser, le challenger peut annuler.
  if (duel.opponentId !== me && duel.challengerId !== me) {
    return { error: "Action non autorisée." };
  }

  const ops = [];
  if (duel.stake > 0) {
    ops.push(db.user.update({ where: { id: duel.challengerId }, data: { points: { increment: duel.stake } } }));
  }
  ops.push(db.duel.update({ where: { id: duelId }, data: { status: "DECLINED", resolvedAt: new Date() } }));
  await db.$transaction(ops);

  revalidatePath("/dashboard/duels");
  revalidatePath("/dashboard");
  return { ok: true };
}
