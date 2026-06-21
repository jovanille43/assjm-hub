"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────────
   Toasts ASSJM — store externe minimal + fonction impérative `toast()`.
   Usage : import { toast } from "@/components/ui/toast"; toast.success("…").
   Le <Toaster /> est monté une fois dans le layout racine.
   ──────────────────────────────────────────────────────────────────────────── */

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
};

let items: ToastItem[] = [];
let counter = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function remove(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

function push(
  variant: ToastVariant,
  title: string,
  opts?: { description?: string; duration?: number },
) {
  const id = ++counter;
  const duration = opts?.duration ?? 4000;
  items = [...items, { id, title, variant, description: opts?.description, duration }];
  emit();
  if (duration > 0 && typeof window !== "undefined") {
    window.setTimeout(() => remove(id), duration);
  }
  return id;
}

export const toast = Object.assign(
  (title: string, opts?: { description?: string; duration?: number }) =>
    push("info", title, opts),
  {
    success: (title: string, opts?: { description?: string; duration?: number }) =>
      push("success", title, opts),
    error: (title: string, opts?: { description?: string; duration?: number }) =>
      push("error", title, opts),
    info: (title: string, opts?: { description?: string; duration?: number }) =>
      push("info", title, opts),
    dismiss: remove,
  },
);

const STYLES: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; ring: string; iconColor: string }
> = {
  success: { icon: CheckCircle2, ring: "ring-emerald-500/30", iconColor: "text-emerald-400" },
  error: { icon: AlertCircle, ring: "ring-red-500/30", iconColor: "text-red-400" },
  info: { icon: Info, ring: "ring-club/30", iconColor: "text-club" },
};

export function Toaster() {
  const snapshot = React.useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => items,
    () => items,
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
      <AnimatePresence initial={false}>
        {snapshot.map((t) => {
          const s = STYLES[t.variant];
          const Icon = s.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-card/95 p-4 shadow-card-lg ring-1 backdrop-blur",
                s.ring,
              )}
            >
              <Icon className={cn("mt-0.5 size-5 shrink-0", s.iconColor)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => remove(t.id)}
                className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Fermer"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
