import { db } from "@/lib/db";
import { sendPushToUsers } from "@/lib/push";

export type NotifType = "DUEL" | "PRONO" | "BADGE" | "ROLE" | "CONVOCATION" | "INFO";

export type NotifInput = {
  type: NotifType;
  title: string;
  body?: string;
  link?: string;
  icon?: string;
};

const DEFAULT_ICON: Record<NotifType, string> = {
  DUEL: "⚔️", PRONO: "🎯", BADGE: "🏅", ROLE: "🎖️", CONVOCATION: "📋", INFO: "🔔",
};

/** Crée une notification (best-effort : n'interrompt jamais l'action appelante). */
export async function notify(userId: string, n: NotifInput): Promise<void> {
  if (!userId) return;
  try {
    await db.notification.create({
      data: {
        userId,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        icon: n.icon ?? DEFAULT_ICON[n.type],
      },
    });
    await sendPushToUsers([userId], { title: n.title, body: n.body, url: n.link });
  } catch {
    /* noop */
  }
}

/** Notifie plusieurs utilisateurs d'un coup. */
export async function notifyMany(userIds: string[], n: NotifInput): Promise<void> {
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (ids.length === 0) return;
  try {
    await db.notification.createMany({
      data: ids.map((userId) => ({
        userId,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        icon: n.icon ?? DEFAULT_ICON[n.type],
      })),
    });
    await sendPushToUsers(ids, { title: n.title, body: n.body, url: n.link });
  } catch {
    /* noop */
  }
}

export function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({ where: { userId, read: false } });
}

export function getNotifications(userId: string, limit = 20) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
