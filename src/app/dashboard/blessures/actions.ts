"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const STAFF = ["COACH", "DIRIGEANT", "ADMIN"];

export async function reportStatus(data: {
  type: string;
  description?: string;
  estimatedReturn?: string;
}): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé." };

  const player = await db.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!player) return { error: "Profil joueur introuvable." };

  // Clôturer le statut actif précédent
  await db.playerStatus.updateMany({
    where: { playerId: player.id, resolvedAt: null },
    data: { resolvedAt: new Date() },
  });

  await db.playerStatus.create({
    data: {
      playerId: player.id,
      type: data.type,
      description: data.description?.trim() || null,
      estimatedReturn: data.estimatedReturn ? new Date(data.estimatedReturn) : null,
    },
  });

  revalidatePath("/dashboard/blessures");
  return {};
}

export async function resolveStatus(statusId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé." };

  const isStaff = STAFF.includes(session.user.role ?? "");
  const player = await db.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const status = await db.playerStatus.findUnique({ where: { id: statusId } });
  if (!status) return { error: "Statut introuvable." };
  if (!isStaff && status.playerId !== player?.id) return { error: "Non autorisé." };

  await db.playerStatus.update({
    where: { id: statusId },
    data: { resolvedAt: new Date() },
  });

  revalidatePath("/dashboard/blessures");
  return {};
}
