"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notify } from "@/lib/notifications";

const ATTENDANCE_POINTS: Record<string, number> = { PRESENT: 25, EXCUSED: 5, ABSENT: 0 };

const STAFF_ROLES = ["ADMIN", "DIRIGEANT", "COACH"];

async function requireStaff() {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorisé");
  if (!STAFF_ROLES.includes(session.user.role ?? "")) throw new Error("Réservé au staff");
  return session;
}

export async function createEvent(formData: FormData): Promise<{ error?: string }> {
  try {
    await requireStaff();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Non autorisé" };
  }

  const type = formData.get("type") as string;
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const startStr = formData.get("start") as string;
  const endStr = formData.get("end") as string;
  const location = (formData.get("location") as string)?.trim() || null;
  const teamId = (formData.get("teamId") as string) || null;

  if (!type || !title || !startStr) return { error: "Type, titre et date de début sont requis." };

  const start = new Date(startStr);
  if (isNaN(start.getTime())) return { error: "Date de début invalide." };
  const end = endStr ? new Date(endStr) : null;
  if (end && isNaN(end.getTime())) return { error: "Date de fin invalide." };

  await db.event.create({
    data: { type, title, description, start, end, location, teamId: teamId || null },
  });

  revalidatePath("/dashboard/calendrier");
  revalidatePath("/dashboard");
  revalidatePath("/calendrier");
  return {};
}

export async function updateEvent(
  id: string,
  formData: FormData,
): Promise<{ error?: string }> {
  try {
    await requireStaff();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Non autorisé" };
  }

  const type = formData.get("type") as string;
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const startStr = formData.get("start") as string;
  const endStr = formData.get("end") as string;
  const location = (formData.get("location") as string)?.trim() || null;
  const teamId = (formData.get("teamId") as string) || null;

  if (!type || !title || !startStr) return { error: "Champs requis manquants." };
  const start = new Date(startStr);
  if (isNaN(start.getTime())) return { error: "Date invalide." };
  const end = endStr ? new Date(endStr) : null;

  await db.event.update({
    where: { id },
    data: { type, title, description, start, end, location, teamId: teamId || null },
  });

  revalidatePath("/dashboard/calendrier");
  revalidatePath("/dashboard");
  revalidatePath("/calendrier");
  return {};
}

export async function deleteEvent(id: string): Promise<{ error?: string }> {
  try {
    await requireStaff();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Non autorisé" };
  }

  await db.event.delete({ where: { id } });
  revalidatePath("/dashboard/calendrier");
  revalidatePath("/dashboard");
  revalidatePath("/calendrier");
  return {};
}

export async function cancelEvent(id: string, cancelled: boolean): Promise<{ error?: string }> {
  try {
    await requireStaff();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Non autorisé" };
  }
  await db.event.update({ where: { id }, data: { cancelled } });
  revalidatePath("/dashboard/calendrier");
  revalidatePath("/calendrier");
  return {};
}

export async function createRecurringTraining(formData: FormData): Promise<{ error?: string; count?: number }> {
  try {
    await requireStaff();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Non autorisé" };
  }

  const title = (formData.get("title") as string)?.trim();
  const startStr = formData.get("start") as string;
  const endStr = formData.get("end") as string;
  const location = (formData.get("location") as string)?.trim() || null;
  const teamId = (formData.get("teamId") as string) || null;
  const weeksStr = formData.get("weeks") as string;
  const description = (formData.get("description") as string)?.trim() || null;

  if (!title || !startStr) return { error: "Titre et date requis." };
  const start = new Date(startStr);
  if (isNaN(start.getTime())) return { error: "Date invalide." };
  const end = endStr ? new Date(endStr) : null;
  const weeks = Math.min(52, Math.max(1, parseInt(weeksStr || "8", 10)));

  const recurrenceId = Math.random().toString(36).slice(2, 10);
  const events = Array.from({ length: weeks }, (_, i) => {
    const s = new Date(start);
    s.setDate(s.getDate() + i * 7);
    const e = end ? new Date(end) : null;
    if (e) e.setDate(e.getDate() + i * 7);
    return { type: "TRAINING", title, description, start: s, end: e, location, teamId: teamId || null, recurrenceId };
  });

  await db.event.createMany({ data: events });
  revalidatePath("/dashboard/calendrier");
  revalidatePath("/dashboard");
  revalidatePath("/calendrier");
  return { count: weeks };
}

export async function recordAttendance(
  eventId: string,
  playerId: string,
  status: "PRESENT" | "ABSENT" | "EXCUSED",
  note?: string,
): Promise<{ error?: string }> {
  try {
    await requireStaff();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Non autorisé" };
  }

  // Compute point delta between old and new status
  const existing = await db.eventAttendance.findUnique({
    where: { eventId_playerId: { eventId, playerId } },
    select: { status: true },
  });
  const oldPts = ATTENDANCE_POINTS[existing?.status ?? "ABSENT"] ?? 0;
  const newPts = ATTENDANCE_POINTS[status] ?? 0;
  const delta = newPts - oldPts;

  await db.eventAttendance.upsert({
    where: { eventId_playerId: { eventId, playerId } },
    create: { eventId, playerId, status, note: note || null },
    update: { status, note: note || null },
  });

  if (delta !== 0) {
    const player = await db.player.findUnique({
      where: { id: playerId },
      select: { userId: true },
    });
    if (player?.userId) {
      await db.user.update({ where: { id: player.userId }, data: { points: { increment: delta } } });
      if (delta > 0) {
        await notify(player.userId, {
          type: "INFO",
          title: `Présence enregistrée · +${delta} pts`,
          body: status === "PRESENT" ? "Bravo pour ta présence à l'entraînement !" : "Ta justification a été prise en compte.",
          link: "/dashboard",
        });
      }
    }
  }

  revalidatePath("/dashboard/calendrier");
  return {};
}

export async function deleteRecurringEvents(recurrenceId: string): Promise<{ error?: string }> {
  try {
    await requireStaff();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Non autorisé" };
  }
  await db.event.deleteMany({ where: { recurrenceId } });
  revalidatePath("/dashboard/calendrier");
  revalidatePath("/calendrier");
  return {};
}
