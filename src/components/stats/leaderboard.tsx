"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { RankedPlayer } from "@/lib/stats";
import { initials } from "@/lib/utils";

const PODIUM = ["text-amber-400", "text-zinc-400", "text-amber-700"];

export function Leaderboard({
  title,
  icon,
  unit,
  items,
  accent = "#E11D2A",
}: {
  title: string;
  icon: ReactNode;
  unit: string;
  items: RankedPlayer[];
  accent?: string;
}) {
  const max = items.length > 0 ? Math.max(...items.map((i) => i.value)) : 1;

  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="mb-5 flex items-center gap-2">
        <span
          className="grid size-9 place-items-center rounded-xl text-white"
          style={{ background: accent }}
        >
          {icon}
        </span>
        <h2 className="font-display text-xl font-bold">{title}</h2>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Pas encore de données cette saison.
        </p>
      ) : (
        <ol className="space-y-3">
          {items.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3">
              <span
                className={`w-5 text-center font-display text-lg font-bold ${PODIUM[i] ?? "text-muted-foreground"}`}
              >
                {i + 1}
              </span>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-navy-600 to-navy-900 text-xs font-bold text-white">
                {initials(`${p.firstName} ${p.lastName}`)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">
                    {p.firstName} {p.lastName}
                  </span>
                  <span className="shrink-0 font-display text-sm font-bold">
                    {p.value}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      {unit}
                    </span>
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: accent }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.max(8, (p.value / max) * 100)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
