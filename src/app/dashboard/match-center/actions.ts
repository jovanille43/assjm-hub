"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { resolvePredictions } from "@/app/dashboard/pronos/actions";
import { syncBadges } from "@/lib/badges";
import { notifyMany } from "@/lib/notifications";

const STAFF_ROLES = ["ADMIN", "DIRIGEANT", "COACH"];

export type ScorerInput = { playerId: string; goals: number; assists: number };

export async function createMatch(input: {
  teamId: string;
  opponent: string;
  date: string;
  venue: string;
  competition: string;
}): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };
  if (!STAFF_ROLES.includes(session.user.role ?? "")) return { error: "Réservé au staff." };

  const opponent = input.opponent.trim();
  if (!input.teamId || !opponent || !input.date) return { error: "Équipe, adversaire et date requis." };
  const date = new Date(input.date);
  if (isNaN(date.getTime())) return { error: "Date invalide." };

  const created = await db.match.create({
    data: {
      teamId: input.teamId,
      opponent,
      date,
      venue: input.venue === "AWAY" ? "AWAY" : "HOME",
      competition: input.competition.trim() || null,
      status: "SCHEDULED",
    },
  });

  // Auto-convoque tous les joueurs de l'équipe
  const teamPlayers = await db.player.findMany({
    where: { teamId: input.teamId },
    select: { id: true, userId: true },
  });
  for (const p of teamPlayers) {
    await db.convocation.create({
      data: { matchId: created.id, playerId: p.id, status: "PENDING" },
    }).catch(() => {});
  }
  const convUserIds = teamPlayers.filter((p) => p.userId).map((p) => p.userId as string);
  if (convUserIds.length > 0) {
    await notifyMany(convUserIds, {
      type: "CONVOCATION",
      title: "Tu es convoqué !",
      body: `Match contre ${opponent} — réponds présent ou indique ton absence.`,
      link: "/dashboard/convocations",
    });
  }

  revalidatePath("/dashboard/convocations");
  revalidatePath("/dashboard/match-center");
  revalidatePath("/calendrier");
  revalidatePath("/dashboard/pronos");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteMatch(matchId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };
  if (!STAFF_ROLES.includes(session.user.role ?? "")) return { error: "Réservé au staff." };

  await db.match.delete({ where: { id: matchId } });

  revalidatePath("/dashboard/match-center");
  revalidatePath("/calendrier");
  revalidatePath("/dashboard/pronos");
  revalidatePath("/dashboard");
  return {};
}

export async function recordFullMatch(input: {
  matchId: string;
  scoreFor: number;
  scoreAgainst: number;
  report: string;
  mvpPlayerId: string | null;
  scorers: ScorerInput[];
}): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };
  if (!STAFF_ROLES.includes(session.user.role ?? "")) return { error: "Réservé au staff." };

  const f = Math.round(input.scoreFor);
  const a = Math.round(input.scoreAgainst);
  if (!Number.isInteger(f) || !Number.isInteger(a) || f < 0 || a < 0 || f > 30 || a > 30) {
    return { error: "Score invalide." };
  }

  const match = await db.match.findUnique({ where: { id: input.matchId }, select: { teamId: true } });
  if (!match) return { error: "Match introuvable." };

  await db.match.update({
    where: { id: input.matchId },
    data: { scoreFor: f, scoreAgainst: a, status: "FINISHED", report: input.report.trim() || null },
  });

  // Stats des joueurs : on ne garde que ceux qui ont marqué/passé ou le MVP.
  const relevant = input.scorers.filter(
    (s) => s.goals > 0 || s.assists > 0 || s.playerId === input.mvpPlayerId,
  );
  for (const s of relevant) {
    await db.matchStat.upsert({
      where: { matchId_playerId: { matchId: input.matchId, playerId: s.playerId } },
      create: {
        matchId: input.matchId,
        playerId: s.playerId,
        goals: Math.max(0, Math.round(s.goals)),
        assists: Math.max(0, Math.round(s.assists)),
        minutes: 90,
        started: true,
        isMvp: s.playerId === input.mvpPlayerId,
      },
      update: {
        goals: Math.max(0, Math.round(s.goals)),
        assists: Math.max(0, Math.round(s.assists)),
        isMvp: s.playerId === input.mvpPlayerId,
      },
    });
  }

  // Un seul MVP par match.
  if (input.mvpPlayerId) {
    await db.matchStat.updateMany({
      where: { matchId: input.matchId, playerId: { not: input.mvpPlayerId }, isMvp: true },
      data: { isMvp: false },
    });
  }

  // Règle les pronostics liés.
  await resolvePredictions(input.matchId);

  // Recalcule les badges des joueurs impliqués (buts/passes/MVP).
  const players = await db.player.findMany({
    where: { id: { in: relevant.map((s) => s.playerId) }, userId: { not: null } },
    select: { userId: true },
  });
  const userIds = players.map((p) => p.userId as string);
  for (const uid of userIds) await syncBadges(uid).catch(() => {});

  await notifyMany(userIds, {
    type: "INFO",
    title: "Feuille de match publiée 📝",
    body: "Tes stats du match ont été enregistrées.",
    link: "/dashboard",
  });

  // Ouvre la 3ᵉ mi-temps : on invite toute l'équipe à élire la Star du match.
  if (match.teamId) {
    const team = await db.player.findMany({
      where: { teamId: match.teamId, userId: { not: null } },
      select: { userId: true },
    });
    await notifyMany(
      team.map((p) => p.userId as string),
      {
        type: "INFO",
        title: "Vote ouvert : Star du match ⭐",
        body: "Élis l'homme du match et note tes coéquipiers (48 h).",
        link: `/dashboard/apres-match/${input.matchId}`,
      },
    );
  }

  revalidatePath("/dashboard/match-center");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  revalidatePath("/dashboard/pronos");
  revalidatePath("/calendrier");
  revalidatePath("/dashboard/apres-match");
  return { ok: true };
}
