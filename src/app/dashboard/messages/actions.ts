"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { canAccess } from "@/lib/messages";
import { syncBadges } from "@/lib/badges";

export async function sendMessage(channelKey: string, content: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorisé");
  const text = content.trim();
  if (!text) return;

  const channel = await db.channel.findUnique({ where: { key: channelKey } });
  if (!channel || !canAccess(channel.access, session.user.role)) {
    throw new Error("Accès refusé");
  }

  await db.message.create({
    data: {
      channelId: channel.id,
      authorId: session.user.id,
      content: text.slice(0, 1000),
    },
  });

  await syncBadges(session.user.id).catch(() => {}); // âme du vestiaire (contributions)
  revalidatePath("/dashboard/messages");
}
