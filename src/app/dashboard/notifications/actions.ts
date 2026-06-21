"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getNotifications, getUnreadCount } from "@/lib/notifications";

export type ClientNotif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  icon: string | null;
  read: boolean;
  createdAt: string;
};

export async function fetchNotifications(): Promise<{ items: ClientNotif[]; unread: number }> {
  const session = await auth();
  if (!session?.user) return { items: [], unread: 0 };
  const [items, unread] = await Promise.all([
    getNotifications(session.user.id, 20),
    getUnreadCount(session.user.id),
  ]);
  return {
    unread,
    items: items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      icon: n.icon,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

export async function markRead(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  await db.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { read: true },
  });
  revalidatePath("/dashboard/notifications");
}

export async function markAllRead(): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/dashboard/notifications");
}

export async function savePushSubscription(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<{ ok?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };
  await db.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: { userId: session.user.id, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
    update: { userId: session.user.id, p256dh: sub.p256dh, auth: sub.auth },
  });
  return { ok: true };
}

export async function removePushSubscription(endpoint: string): Promise<{ ok?: boolean }> {
  const session = await auth();
  if (!session?.user) return { ok: true };
  await db.pushSubscription.deleteMany({ where: { endpoint, userId: session.user.id } });
  return { ok: true };
}
