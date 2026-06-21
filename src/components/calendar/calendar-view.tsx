"use client";

import * as React from "react";
import {
  addDays,
  addMonths,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
} from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import type { CalItem } from "@/lib/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TYPE_META: Record<string, { label: string; color: string }> = {
  MATCH: { label: "Match", color: "#E11D2A" },
  TRAINING: { label: "Entraînement", color: "#3b82f6" },
  TOURNAMENT: { label: "Tournoi", color: "#f59e0b" },
  MEETING: { label: "Réunion", color: "#8b5cf6" },
  EVENT: { label: "Événement", color: "#22c55e" },
};

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function CalendarView({ items }: { items: CalItem[] }) {
  const today = React.useMemo(() => new Date(), []);
  const [cursor, setCursor] = React.useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = React.useState<Date>(() => new Date());

  const monthStart = startOfMonth(cursor);
  const startOffset = (getDay(monthStart) + 6) % 7; // lundi = 0
  const gridStart = addDays(monthStart, -startOffset);
  const cells = React.useMemo(
    () => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)),
    [gridStart],
  );

  const itemsByDay = React.useMemo(() => {
    const map = new Map<string, CalItem[]>();
    for (const it of items) {
      const key = format(new Date(it.start), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(it);
      map.set(key, arr);
    }
    return map;
  }, [items]);

  const dayItems = (d: Date) => itemsByDay.get(format(d, "yyyy-MM-dd")) ?? [];
  const selectedItems = dayItems(selected);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
      {/* Grille du mois */}
      <div className="rounded-2xl border bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold capitalize">
            {format(cursor, "MMMM yyyy", { locale: fr })}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCursor(startOfMonth(new Date()));
                setSelected(new Date());
              }}
            >
              Aujourd'hui
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Mois précédent"
              onClick={() => setCursor((c) => addMonths(c, -1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Mois suivant"
              onClick={() => setCursor((c) => addMonths(c, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day) => {
            const dItems = dayItems(day);
            const inMonth = isSameMonth(day, cursor);
            const isSel = isSameDay(day, selected);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelected(day)}
                className={cn(
                  "flex min-h-[64px] flex-col items-stretch gap-1 rounded-lg border p-1.5 text-left transition-colors sm:min-h-[84px]",
                  inMonth ? "bg-background" : "bg-secondary/30 opacity-50",
                  isSel ? "border-club ring-1 ring-club" : "border-border hover:border-club/40",
                )}
              >
                <span
                  className={cn(
                    "ml-auto grid size-6 place-items-center rounded-full text-xs font-semibold",
                    isToday(day) && "bg-club text-white",
                  )}
                >
                  {format(day, "d")}
                </span>
                <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                  {dItems.slice(0, 2).map((it) => {
                    const meta = TYPE_META[it.type] ?? TYPE_META.EVENT;
                    return (
                      <span
                        key={it.id}
                        className="hidden truncate rounded px-1 py-0.5 text-[10px] font-medium text-white sm:block"
                        style={{ background: meta.color }}
                      >
                        {it.title}
                      </span>
                    );
                  })}
                  {/* points sur mobile */}
                  <div className="flex gap-0.5 sm:hidden">
                    {dItems.slice(0, 3).map((it) => {
                      const meta = TYPE_META[it.type] ?? TYPE_META.EVENT;
                      return (
                        <span
                          key={it.id}
                          className="size-1.5 rounded-full"
                          style={{ background: meta.color }}
                        />
                      );
                    })}
                  </div>
                  {dItems.length > 2 && (
                    <span className="hidden text-[10px] text-muted-foreground sm:block">
                      +{dItems.length - 2}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Légende */}
        <div className="mt-4 flex flex-wrap gap-3 border-t pt-4">
          {Object.entries(TYPE_META).map(([k, m]) => (
            <span key={k} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2.5 rounded-full" style={{ background: m.color }} />
              {m.label}
            </span>
          ))}
        </div>
      </div>

      {/* Détail du jour sélectionné */}
      <div className="rounded-2xl border bg-card p-6">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold capitalize">
          <CalendarDays className="size-5 text-club" />
          {format(selected, "EEEE d MMMM", { locale: fr })}
        </h3>
        <div className="mt-4 space-y-3">
          {selectedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Rien de prévu ce jour-là.</p>
          ) : (
            selectedItems.map((it) => {
              const meta = TYPE_META[it.type] ?? TYPE_META.EVENT;
              return (
                <div
                  key={it.id}
                  className="rounded-xl border-l-4 bg-secondary/30 p-3"
                  style={{ borderColor: meta.color }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                      style={{ background: meta.color }}
                    >
                      {meta.label}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {format(new Date(it.start), "HH'h'mm")}
                    </span>
                  </div>
                  <p className="mt-1.5 font-semibold leading-snug">{it.title}</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    {it.teamName && <span>{it.teamName}</span>}
                    {it.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" />
                        {it.location}
                      </span>
                    )}
                    {it.meta && <span>{it.meta}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
