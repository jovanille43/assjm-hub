"use client";

import * as React from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { savePushSubscription, removePushSubscription } from "@/app/dashboard/notifications/actions";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function PushToggle() {
  const [supported, setSupported] = React.useState(false);
  const [subscribed, setSubscribed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    const ok =
      !!VAPID &&
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (!ok) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast.error("Autorisation refusée dans le navigateur.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID!),
      });
      const json = sub.toJSON();
      await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      });
      setSubscribed(true);
      toast.success("Notifications push activées 🔔");
    } catch {
      toast.error("Impossible d'activer les notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast.success("Notifications push désactivées.");
    } catch {
      toast.error("Erreur lors de la désactivation.");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-secondary/30 px-4 py-3">
      <div className="flex items-center gap-2 text-sm">
        {subscribed ? <Bell className="size-4 text-club" /> : <BellOff className="size-4 text-muted-foreground" />}
        <span>
          Notifications push
          <span className="ml-1 text-xs text-muted-foreground">
            {subscribed ? "(activées sur cet appareil)" : "(défis, pronos, badges…)"}
          </span>
        </span>
      </div>
      <Button size="sm" variant={subscribed ? "outline" : "default"} onClick={subscribed ? disable : enable} disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        {subscribed ? "Désactiver" : "Activer"}
      </Button>
    </div>
  );
}
