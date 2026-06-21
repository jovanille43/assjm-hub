"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { syncBadges } from "@/lib/badges";

export async function castVote(
  type: "MVP" | "PLAYER_OF_MONTH",
  targetId: string,
  ctx: { matchId?: string; period?: string },
) {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorisé");

  const matchId = ctx.matchId ?? null;
  const period = ctx.period ?? null;

  // Un seul vote par utilisateur et par contexte (on remplace le précédent)
  await db.vote.deleteMany({
    where: { userId: session.user.id, type, matchId, period },
  });
  await db.vote.create({
    data: { userId: session.user.id, type, targetId, matchId, period },
  });

  // C'est le joueur élu qui gagne en « votes reçus » → badge Joueur du mois.
  if (type === "PLAYER_OF_MONTH") {
    const target = await db.player.findUnique({
      where: { id: targetId },
      select: { userId: true },
    });
    if (target?.userId) await syncBadges(target.userId).catch(() => {});
  }

  revalidatePath("/dashboard/votes");
}
