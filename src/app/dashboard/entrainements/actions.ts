"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notifyMany } from "@/lib/notifications";

const STAFF = ["COACH", "DIRIGEANT", "ADMIN"];

export async function remindTrainingPending(
  eventId: string,
): Promise<{ error?: string; count?: number }> {
  const session = await auth();
  if (!session?.user || !STAFF.includes(session.user.role ?? "")) {
    return { error: "Réservé au staff." };
  }

  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { title: true, start: true, teamId: true },
  });
  if (!event) return { error: "Entraînement introuvable." };

  // Joueurs de l'équipe qui n'ont pas encore répondu
  const teamPlayers = event.teamId
    ? await db.player.findMany({
        where: { teamId: event.teamId },
        select: { id: true, userId: true },
      })
    : [];

  const responded = await db.eventAttendance.findMany({
    where: { eventId },
    select: { playerId: true },
  });
  const respondedIds = new Set(responded.map((r) => r.playerId));

  const userIds = teamPlayers
    .filter((p) => !respondedIds.has(p.id) && p.userId)
    .map((p) => p.userId as string);

  if (userIds.length === 0) return { count: 0 };

  const dateStr = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(event.start));

  await notifyMany(userIds, {
    type: "CONVOCATION",
    title: "Rappel : entraînement",
    body: `${event.title} ${dateStr} — confirme ta présence.`,
    link: "/dashboard/convocations",
  });

  revalidatePath("/dashboard/entrainements");
  return { count: userIds.length };
}
