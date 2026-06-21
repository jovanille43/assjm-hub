"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notifyMany } from "@/lib/notifications";

const STAFF = ["COACH", "DIRIGEANT", "ADMIN"];

export async function createAnnouncement(data: {
  title: string;
  content: string;
  teamId: string | null;
  pinned: boolean;
}): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user || !STAFF.includes(session.user.role ?? "")) {
    return { error: "Réservé au staff." };
  }
  if (!data.title.trim() || !data.content.trim()) {
    return { error: "Titre et contenu requis." };
  }

  await db.announcement.create({
    data: {
      authorId: session.user.id,
      teamId: data.teamId || null,
      title: data.title.trim(),
      content: data.content.trim(),
      pinned: data.pinned,
    },
  });

  // Notifier les joueurs concernés
  const players = await (data.teamId
    ? db.player.findMany({ where: { teamId: data.teamId }, select: { userId: true } })
    : db.player.findMany({ select: { userId: true } }));

  const userIds = players.map((p) => p.userId).filter((x): x is string => !!x);
  await notifyMany(userIds, {
    type: "INFO",
    title: `📢 ${data.title.trim()}`,
    body: data.content.trim().slice(0, 100),
    link: "/dashboard/annonces",
  });

  revalidatePath("/dashboard/annonces");
  return {};
}

export async function deleteAnnouncement(id: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user || !STAFF.includes(session.user.role ?? "")) {
    return { error: "Réservé au staff." };
  }
  await db.announcement.delete({ where: { id } });
  revalidatePath("/dashboard/annonces");
  return {};
}
