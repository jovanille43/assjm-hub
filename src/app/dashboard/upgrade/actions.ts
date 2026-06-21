"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UPGRADE_COSTS } from "@/components/player/player-card";

export async function upgradeCard(): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé." };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { player: true },
  });

  if (!user) return { error: "Utilisateur introuvable." };
  if (!user.player) return { error: "Aucun joueur lié à votre compte." };

  const currentLevel = user.player.upgradeLevel;
  if (currentLevel >= 5) return { error: "Niveau maximum atteint !" };

  const cost = UPGRADE_COSTS[currentLevel + 1];
  if (user.points < cost) {
    return { error: `Points insuffisants (${cost} pts requis, vous avez ${user.points} pts).` };
  }

  await db.$transaction([
    db.player.update({
      where: { id: user.player.id },
      data: { upgradeLevel: currentLevel + 1 },
    }),
    db.user.update({
      where: { id: user.id },
      data: { points: { decrement: cost } },
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/joueurs");
  return {};
}
