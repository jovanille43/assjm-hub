"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, CheckCheck } from "lucide-react";
import {
  fetchNotifications,
  markAllRead,
  markRead,
  type ClientNotif,
} from "@/app/dashboard/notifications/actions";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<ClientNotif[]>([]);
  const [unread, setUnread] = React.useState(0);

  const load = React.useCallback(async () => {
    const res = await fetchNotifications();
    setItems(res.items);
    setUnread(res.unread);
  }, []);

  React.useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  async function openItem(n: ClientNotif) {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      markRead(n.id);
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  async function readAll() {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
    await markAllRead();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative grid size-10 place-items-center rounded-full transition-colors hover:bg-secondary"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-club px-1 text-[10px] font-bold leading-4 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-50 mt-2 w-[20rem] max-w-[90vw] overflow-hidden rounded-2xl border bg-card shadow-card-lg"
            >
              <div className="flex items-center justify-between border-b px-4 py-2.5">
                <span className="font-display text-sm font-bold">Notifications</span>
                {unread > 0 && (
                  <button
                    onClick={readAll}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-club"
                  >
                    <CheckCheck className="size-3.5" /> Tout lire
                  </button>
                )}
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {items.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Aucune notification pour l'instant.
                  </p>
                ) : (
                  items.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => openItem(n)}
                      className={cn(
                        "flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors last:border-0 hover:bg-secondary/50",
                        !n.read && "bg-club/5",
                      )}
                    >
                      <span className="mt-0.5 text-lg">{n.icon ?? "🔔"}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{n.title}</span>
                        {n.body && (
                          <span className="block truncate text-xs text-muted-foreground">{n.body}</span>
                        )}
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })}
                        </span>
                      </span>
                      {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-club" />}
                    </button>
                  ))
                )}
              </div>

              <Link
                href="/dashboard/notifications"
                onClick={() => setOpen(false)}
                className="block border-t px-4 py-2.5 text-center text-xs font-semibold text-club hover:bg-secondary/50"
              >
                Tout voir
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
