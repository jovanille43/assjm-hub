import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { notify } from "@/lib/notifications";
import { BADGE_POINTS, evaluateBadgeRules, type BadgeFacts } from "@/lib/badge-rules";

/* ────────────────────────────────────────────────────────────────────────────
   Couche E/S du moteur de badges : calcul des faits depuis la base, aperçu en
   lecture seule (pour le rendu) et attribution explicite (writes + points +
   notification). Les règles pures vivent dans badge-rules.ts (testées à part).
   ──────────────────────────────────────────────────────────────────────────── */

export type { BadgeFacts };

export async function computeBadgeFacts(userId: string): Promise<BadgeFacts | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      player: {
        select: {
          id: true,
          position: true,
          pace: true, shooting: true, passing: true,
          dribbling: true, defending: true, physical: true,
          matchStats: { select: { goals: true, assists: true, isMvp: true } },
        },
      },
    },
  });

  // Session périmée (ex : base re-seedée) — pas d'utilisateur, pas de badges.
  if (!user) return null;

  const player = user.player ?? null;

  const [likesGiven, posts, comments, messages, presences, monthVotes] =
    await Promise.all([
      db.like.count({ where: { userId } }),
      db.post.count({ where: { authorId: userId } }),
      db.comment.count({ where: { authorId: userId } }),
      db.message.count({ where: { authorId: userId } }),
      player
        ? db.convocation.count({ where: { playerId: player.id, status: "ACCEPTED" } })
        : Promise.resolve(0),
      player
        ? db.vote.count({ where: { targetId: player.id, type: "PLAYER_OF_MONTH" } })
        : Promise.resolve(0),
    ]);

  const stats = player?.matchStats ?? [];

  return {
    isPlayer: !!player,
    goalsTotal: stats.reduce((s, m) => s + m.goals, 0),
    assistsTotal: stats.reduce((s, m) => s + m.assists, 0),
    maxGoalsInMatch: stats.reduce((max, m) => Math.max(max, m.goals), 0),
    matchesPlayed: stats.length,
    mvpCount: stats.filter((m) => m.isMvp).length,
    presences,
    isDefensive: player ? ["GK", "DEF"].includes(player.position) : false,
    monthVotesReceived: monthVotes,
    likesGiven,
    contributions: posts + comments + messages,
    allStatsAbove80: player
      ? [player.pace, player.shooting, player.passing, player.dribbling, player.defending, player.physical]
          .every((s) => s >= 80)
      : false,
  };
}

export type EarnedBadge = {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
};

export type NextBadge = EarnedBadge & { current: number; target: number };

/** Charge les badges du seed + ceux déjà possédés (index par id et par clé). */
async function loadBadgeState(userId: string) {
  const [badges, owned] = await Promise.all([
    db.badge.findMany(),
    db.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
  ]);
  const byKey = new Map(badges.map((b) => [b.key, b]));
  const ownedById = new Set(owned.map((o) => o.badgeId));
  const ownedKeys = new Set(
    badges.filter((b) => ownedById.has(b.id)).map((b) => b.key),
  );
  return { badges, byKey, ownedById, ownedKeys };
}

/**
 * Lecture seule de l'aperçu badges (rendu du tableau de bord).
 * N'attribue RIEN et n'a aucun effet de bord — un rendu ne doit jamais muter la
 * base. L'attribution passe par syncBadges, déclenché par des actions explicites.
 */
export async function getBadgeProgress(
  userId: string,
): Promise<{ earned: EarnedBadge[]; next: NextBadge[] }> {
  const facts = await computeBadgeFacts(userId);
  if (!facts) return { earned: [], next: [] };

  const { badges, byKey, ownedById, ownedKeys } = await loadBadgeState(userId);
  const { next } = evaluateBadgeRules(facts, ownedKeys);

  const earned = badges.filter((b) => ownedById.has(b.id));
  const nextBadges = next
    .map((n) => {
      const b = byKey.get(n.key);
      return b ? { ...b, current: n.current, target: n.target } : null;
    })
    .filter((b): b is NextBadge => b !== null);

  return { earned, next: nextBadges };
}

/**
 * Attribution explicite (inscription, fin de match, vote, post…) : crédite les
 * badges fraîchement mérités (+points selon rareté, +notification) et renvoie la
 * liste débloquée. Idempotent : un badge déjà attribué (P2002) est ignoré, donc
 * pas de double crédit même sous déclencheurs concurrents.
 */
export async function syncBadges(userId: string): Promise<EarnedBadge[]> {
  const facts = await computeBadgeFacts(userId);
  if (!facts) return [];

  const { byKey, ownedKeys } = await loadBadgeState(userId);
  const { toAward } = evaluateBadgeRules(facts, ownedKeys);

  const newlyEarned: EarnedBadge[] = [];
  for (const key of toAward) {
    const badge = byKey.get(key);
    if (!badge) continue;
    try {
      await db.userBadge.create({ data: { userId, badgeId: badge.id } });
      await db.user.update({
        where: { id: userId },
        data: { points: { increment: BADGE_POINTS[badge.rarity] ?? 10 } },
      });
      newlyEarned.push(badge);
      await notify(userId, {
        type: "BADGE",
        title: `Badge débloqué : ${badge.name} ${badge.icon}`,
        body: badge.description,
        link: "/dashboard",
      });
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) {
        throw e;
      }
      // Badge déjà attribué par un déclencheur parallèle : pas de double points.
    }
  }

  return newlyEarned;
}
