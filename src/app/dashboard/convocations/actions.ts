"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notify, notifyMany } from "@/lib/notifications";
import { syncBadges } from "@/lib/badges";

const STAFF = ["COACH", "DIRIGEANT", "ADMIN"];

/** Réponse du joueur à sa convocation (présent / absent + justification). */
export async function respondConvocation(
  convocationId: string,
  status: "ACCEPTED" | "DECLINED" | "UNCERTAIN",
  reason?: string,
) {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorisé");

  const conv = await db.convocation.findUnique({
    where: { id: convocationId },
    include: { player: true },
  });
  if (!conv) throw new Error("Convocation introuvable");

  const isStaff = STAFF.includes(session.user.role);
  if (conv.player.userId !== session.user.id && !isStaff) {
    throw new Error("Non autorisé");
  }

  await db.convocation.update({
    where: { id: convocationId },
    data: {
      status,
      reason: status === "DECLINED" ? reason?.trim() || null : null,
      respondedAt: new Date(),
    },
  });

  // Bonus réactivité +10 pts : première réponse dans les 24h après la convocation.
  if (conv.status === "PENDING" && conv.player.userId) {
    const elapsed = Date.now() - conv.createdAt.getTime();
    if (elapsed < 24 * 60 * 60 * 1000) {
      await db.user.update({
        where: { id: conv.player.userId },
        data: { points: { increment: 10 } },
      }).catch(() => {});
    }
  }

  // Présent confirmé → badges de présence (Présent, Lion du dimanche…).
  if (status === "ACCEPTED" && conv.player.userId) {
    await syncBadges(conv.player.userId).catch(() => {});
  }

  revalidatePath("/dashboard/convocations");
  revalidatePath("/dashboard");
}

/** Le staff convoque / retire un joueur pour un match. */
export async function toggleConvocation(matchId: string, playerId: string) {
  const session = await auth();
  if (!session?.user || !STAFF.includes(session.user.role)) {
    throw new Error("Non autorisé");
  }

  const existing = await db.convocation.findUnique({
    where: { matchId_playerId: { matchId, playerId } },
  });

  if (existing) {
    await db.convocation.delete({ where: { id: existing.id } });
  } else {
    await db.convocation.create({
      data: { matchId, playerId, status: "PENDING" },
    });
    // Notifie le joueur convoqué.
    const [player, match] = await Promise.all([
      db.player.findUnique({ where: { id: playerId }, select: { userId: true } }),
      db.match.findUnique({ where: { id: matchId }, select: { opponent: true } }),
    ]);
    if (player?.userId) {
      await notify(player.userId, {
        type: "CONVOCATION",
        title: "Tu es convoqué !",
        body: `Match contre ${match?.opponent ?? "l'adversaire"} — réponds présent.`,
        link: "/dashboard/convocations",
      });
    }
  }

  revalidatePath("/dashboard/convocations");
}

/** Déclaration du joueur sur sa présence à un entraînement. */
export async function respondTraining(
  eventId: string,
  status: "PRESENT" | "ABSENT",
) {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorisé");

  const player = await db.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!player) throw new Error("Profil joueur introuvable");

  await db.eventAttendance.upsert({
    where: { eventId_playerId: { eventId, playerId: player.id } },
    create: { eventId, playerId: player.id, status },
    update: { status },
  });

  revalidatePath("/dashboard/convocations");
}

/** Relance les joueurs qui n'ont pas répondu à leur convocation pour un match. */
export async function remindPending(matchId: string): Promise<{ error?: string; count?: number }> {
  const session = await auth();
  if (!session?.user || !STAFF.includes(session.user.role)) return { error: "Réservé au staff." };

  const pending = await db.convocation.findMany({
    where: { matchId, status: "PENDING" },
    select: { player: { select: { userId: true } } },
  });
  const match = await db.match.findUnique({ where: { id: matchId }, select: { opponent: true } });
  const userIds = pending.map((c) => c.player.userId).filter((x): x is string => !!x);

  await notifyMany(userIds, {
    type: "CONVOCATION",
    title: "Rappel : réponds à ta convocation",
    body: `Match contre ${match?.opponent ?? "l'adversaire"} — confirme ta présence.`,
    link: "/dashboard/convocations",
  });

  revalidatePath("/dashboard/convocations");
  return { count: userIds.length };
}
