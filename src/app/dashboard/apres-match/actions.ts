"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sdmDeadline } from "@/lib/postmatch";
import { notify, notifyMany } from "@/lib/notifications";

const STAFF_ROLES = ["ADMIN", "DIRIGEANT", "COACH"];

type Ctx = {
  me: string;
  role: string;
  isStaff: boolean;
  match: { teamId: string; date: Date; status: string; votingMode: string };
};

async function ctx(): Promise<{ me: string; role: string; isStaff: boolean } | null> {
  const session = await auth();
  if (!session?.user) return null;
  return { me: session.user.id, role: session.user.role ?? "", isStaff: STAFF_ROLES.includes(session.user.role ?? "") };
}

/** Vérifie que le membre peut voter/noter pour ce match (fenêtre 48 h + mode). */
async function canParticipate(c: { me: string; isStaff: boolean }, matchId: string): Promise<{ ok: boolean; error?: string; match?: Ctx["match"] }> {
  const match = await db.match.findUnique({
    where: { id: matchId },
    select: { teamId: true, date: true, status: true, votingMode: true },
  });
  if (!match) return { ok: false, error: "Match introuvable." };
  if (match.status !== "FINISHED") return { ok: false, error: "Le match n'est pas terminé." };
  if (new Date() > sdmDeadline(match.date)) return { ok: false, error: "Les votes sont clôturés (48 h écoulées)." };
  if (match.votingMode === "OFF") return { ok: false, error: "Les votes sont désactivés pour ce match." };
  if (match.votingMode === "STAFF" && !c.isStaff) return { ok: false, error: "Votes réservés à l'encadrement." };
  return { ok: true, match };
}

async function notSelf(me: string, playerId: string, teamId: string): Promise<{ ok: boolean; error?: string }> {
  const player = await db.player.findUnique({
    where: { id: playerId },
    select: { teamId: true, userId: true },
  });
  if (!player || player.teamId !== teamId) return { ok: false, error: "Joueur invalide pour ce match." };
  if (player.userId === me) {
    return { ok: false, error: "Tu ne peux pas voter/noter pour toi-même." };
  }
  return { ok: true };
}

export async function voteSdm(matchId: string, playerId: string): Promise<{ error?: string; ok?: boolean }> {
  const c = await ctx();
  if (!c) return { error: "Non autorisé" };
  const part = await canParticipate(c, matchId);
  if (!part.ok || !part.match) return { error: part.error };
  const self = await notSelf(c.me, playerId, part.match.teamId);
  if (!self.ok) return { error: self.error };

  const existing = await db.vote.findFirst({ where: { matchId, userId: c.me, type: "MVP" }, select: { id: true } });
  if (existing) await db.vote.update({ where: { id: existing.id }, data: { targetId: playerId } });
  else await db.vote.create({ data: { userId: c.me, type: "MVP", matchId, targetId: playerId } });

  revalidatePath(`/dashboard/apres-match/${matchId}`);
  return { ok: true };
}

export async function ratePlayer(matchId: string, playerId: string, rating: number): Promise<{ error?: string; ok?: boolean }> {
  const c = await ctx();
  if (!c) return { error: "Non autorisé" };
  const r = Math.round(rating);
  if (r < 1 || r > 10) return { error: "Note entre 1 et 10." };
  const part = await canParticipate(c, matchId);
  if (!part.ok || !part.match) return { error: part.error };
  const self = await notSelf(c.me, playerId, part.match.teamId);
  if (!self.ok) return { error: self.error };

  await db.playerRating.upsert({
    where: { matchId_raterUserId_playerId: { matchId, raterUserId: c.me, playerId } },
    create: { matchId, raterUserId: c.me, playerId, rating: r },
    update: { rating: r },
  });

  revalidatePath(`/dashboard/apres-match/${matchId}`);
  return { ok: true };
}

// N'importe quel membre peut proposer un titre (pendant la fenêtre de vote) ;
// le staff (ou le proposeur) peut le retirer. C'est le côté « chambrage ».
export async function addAward(matchId: string, playerId: string, title: string): Promise<{ error?: string; ok?: boolean }> {
  const c = await ctx();
  if (!c) return { error: "Non autorisé" };
  const part = await canParticipate(c, matchId);
  if (!part.ok || !part.match) return { error: part.error };
  const t = title.trim();
  if (!t) return { error: "Titre requis." };

  const player = await db.player.findUnique({ where: { id: playerId }, select: { teamId: true } });
  if (!player || player.teamId !== part.match.teamId) return { error: "Joueur invalide pour ce match." };

  // Anti-spam : 5 titres max proposés par membre et par match.
  const mine = await db.matchAward.count({ where: { matchId, proposedById: c.me } });
  if (mine >= 5) return { error: "Tu as déjà proposé 5 titres pour ce match." };

  await db.matchAward.create({ data: { matchId, playerId, title: t.slice(0, 60), proposedById: c.me } });
  revalidatePath(`/dashboard/apres-match/${matchId}`);
  return { ok: true };
}

export async function removeAward(awardId: string): Promise<{ error?: string; ok?: boolean }> {
  const c = await ctx();
  if (!c) return { error: "Non autorisé" };
  const award = await db.matchAward.findUnique({ where: { id: awardId }, select: { matchId: true, proposedById: true } });
  if (!award) return { ok: true };
  if (!c.isStaff && award.proposedById !== c.me) return { error: "Tu ne peux retirer que tes propres titres." };
  await db.matchAward.delete({ where: { id: awardId } }).catch(() => {});
  revalidatePath(`/dashboard/apres-match/${award.matchId}`);
  return { ok: true };
}

// 👍 sur un titre (toggle, un par membre et par titre).
export async function toggleAwardVote(awardId: string): Promise<{ error?: string; ok?: boolean }> {
  const c = await ctx();
  if (!c) return { error: "Non autorisé" };
  const award = await db.matchAward.findUnique({ where: { id: awardId }, select: { matchId: true } });
  if (!award) return { error: "Titre introuvable." };
  const existing = await db.awardVote.findUnique({
    where: { awardId_userId: { awardId, userId: c.me } },
    select: { id: true },
  });
  if (existing) await db.awardVote.delete({ where: { id: existing.id } });
  else await db.awardVote.create({ data: { awardId, userId: c.me } });
  revalidatePath(`/dashboard/apres-match/${award.matchId}`);
  return { ok: true };
}

export async function setVotingMode(matchId: string, mode: string): Promise<{ error?: string; ok?: boolean }> {
  const c = await ctx();
  if (!c || !c.isStaff) return { error: "Réservé au staff." };
  if (!["ALL", "STAFF", "OFF"].includes(mode)) return { error: "Mode invalide." };

  const match = await db.match.findUnique({ where: { id: matchId }, select: { votingMode: true } });
  await db.match.update({ where: { id: matchId }, data: { votingMode: mode } });

  // Award rating-based points when closing votes (only once: transition → "OFF")
  if (mode === "OFF" && match?.votingMode !== "OFF") {
    const ratings = await db.playerRating.groupBy({
      by: ["playerId"],
      where: { matchId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    for (const r of ratings) {
      if (!r._avg.rating) continue;
      const player = await db.player.findUnique({ where: { id: r.playerId }, select: { userId: true } });
      if (!player?.userId) continue;
      const pts = Math.round(r._avg.rating) * 5;
      await db.user.update({ where: { id: player.userId }, data: { points: { increment: pts } } });
      const avg = Math.round(r._avg.rating * 10) / 10;
      await notify(player.userId, {
        type: "INFO",
        title: `Note de match : ${avg}/10 · +${pts} pts`,
        body: `Moyenne calculée sur ${r._count._all} vote(s).`,
        link: `/dashboard/apres-match/${matchId}`,
      });
    }
  }

  revalidatePath(`/dashboard/apres-match/${matchId}`);
  return { ok: true };
}

// Relance (staff) les membres de l'équipe qui n'ont PAS encore voté la Star du
// match. Anonymat préservé : on ne révèle à personne qui a voté ou non.
export async function remindSdmVoters(matchId: string): Promise<{ error?: string; count?: number }> {
  const c = await ctx();
  if (!c || !c.isStaff) return { error: "Réservé au staff." };
  const match = await db.match.findUnique({
    where: { id: matchId },
    select: { teamId: true, opponent: true, date: true, status: true, votingMode: true },
  });
  if (!match) return { error: "Match introuvable." };
  if (match.status !== "FINISHED" || new Date() > sdmDeadline(match.date) || match.votingMode === "OFF") {
    return { error: "Le vote n'est pas ouvert." };
  }

  const players = await db.player.findMany({
    where: { teamId: match.teamId, userId: { not: null } },
    select: { userId: true },
  });
  const memberIds = players.map((p) => p.userId as string);
  const voters = await db.vote.findMany({ where: { matchId, type: "MVP" }, select: { userId: true } });
  const voted = new Set(voters.map((v) => v.userId));
  const nonVoters = memberIds.filter((id) => !voted.has(id));
  if (nonVoters.length === 0) return { count: 0 };

  await notifyMany(nonVoters, {
    type: "INFO",
    title: "Vote en cours : Star du match ⭐",
    body: `Tu n'as pas encore élu l'homme du match contre ${match.opponent}. Plus que quelques heures !`,
    link: `/dashboard/apres-match/${matchId}`,
  });
  return { count: nonVoters.length };
}
