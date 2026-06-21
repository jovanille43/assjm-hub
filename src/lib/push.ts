import webpush from "web-push";
import { db } from "@/lib/db";

const PUB = process.env.VAPID_PUBLIC_KEY;
const PRIV = process.env.VAPID_PRIVATE_KEY;

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  if (!PUB || !PRIV) return false;
  webpush.setVapidDetails("mailto:contact@assjm.fr", PUB, PRIV);
  configured = true;
  return true;
}

export type PushPayload = { title: string; body?: string; url?: string };

/** Envoie une push web aux abonnements des utilisateurs (best-effort). */
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return; // pas de clés VAPID → push désactivé, in-app seulement
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (ids.length === 0) return;

  const subs = await db.pushSubscription.findMany({ where: { userId: { in: ids } } });
  if (subs.length === 0) return;

  const data = JSON.stringify({
    title: payload.title,
    body: payload.body ?? "",
    url: payload.url ?? "/dashboard",
  });

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data,
        );
      } catch (e: unknown) {
        const code = (e as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          // Abonnement expiré → on le supprime.
          await db.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        }
      }
    }),
  );
}
