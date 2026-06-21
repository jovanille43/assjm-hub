"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { saveLineup, type SlotInput } from "../actions";

type Player = { id: string; firstName: string; lastName: string; number: number | null };
type RoleConfig = { role: string; count: number; y: number; label: string };

const FORMATIONS: Record<string, RoleConfig[]> = {
  "4-4-2": [
    { role: "GK",  count: 1, y: 87, label: "G" },
    { role: "DEF", count: 4, y: 68, label: "D" },
    { role: "MID", count: 4, y: 45, label: "M" },
    { role: "FWD", count: 2, y: 22, label: "A" },
  ],
  "4-3-3": [
    { role: "GK",  count: 1, y: 87, label: "G" },
    { role: "DEF", count: 4, y: 68, label: "D" },
    { role: "MID", count: 3, y: 46, label: "M" },
    { role: "FWD", count: 3, y: 20, label: "A" },
  ],
  "3-5-2": [
    { role: "GK",  count: 1, y: 87, label: "G" },
    { role: "DEF", count: 3, y: 68, label: "D" },
    { role: "MID", count: 5, y: 46, label: "M" },
    { role: "FWD", count: 2, y: 20, label: "A" },
  ],
  "4-2-3-1": [
    { role: "GK",  count: 1, y: 87, label: "G" },
    { role: "DEF", count: 4, y: 68, label: "D" },
    { role: "DM",  count: 2, y: 55, label: "MD" },
    { role: "AM",  count: 3, y: 37, label: "MA" },
    { role: "FWD", count: 1, y: 18, label: "A" },
  ],
};

function slotX(count: number, idx: number): number {
  const margin = count === 1 ? 50 : 10 + (80 / (count - 1)) * idx;
  return count === 1 ? 50 : margin;
}

type Slots = Record<string, Record<number, string>>;

export function LineupBuilder({
  matchId,
  players,
  existing,
}: {
  matchId: string;
  players: Player[];
  existing: { formation: string; slots: { role: string; slotIndex: number; playerId: string }[] } | null;
}) {
  const [formation, setFormation] = React.useState(existing?.formation ?? "4-4-2");
  const [slots, setSlots] = React.useState<Slots>(() => {
    const init: Slots = {};
    for (const s of existing?.slots ?? []) {
      if (!init[s.role]) init[s.role] = {};
      init[s.role][s.slotIndex] = s.playerId;
    }
    return init;
  });
  const [notes, setNotes] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [saved, setSaved] = React.useState(false);

  const config = FORMATIONS[formation] ?? FORMATIONS["4-4-2"];

  // Reset slots when formation changes (avoid conflicts)
  function changeFormation(f: string) {
    setFormation(f);
    setSlots({});
  }

  function setSlot(role: string, idx: number, playerId: string) {
    setSlots((prev) => {
      const next = { ...prev, [role]: { ...(prev[role] ?? {}), [idx]: playerId } };
      // If same player already placed elsewhere, remove it
      if (playerId) {
        for (const r in next) {
          for (const i in next[r]) {
            if (r === role && Number(i) === idx) continue;
            if (next[r][Number(i)] === playerId) {
              const copy = { ...next[r] };
              delete copy[Number(i)];
              next[r] = copy;
            }
          }
        }
      }
      return next;
    });
  }

  function getAssigned(): Set<string> {
    const s = new Set<string>();
    for (const role in slots) for (const idx in slots[role]) s.add(slots[role][Number(idx)]);
    s.delete("");
    return s;
  }

  function submit() {
    const slotData: SlotInput[] = [];
    for (const cfg of config) {
      for (let i = 0; i < cfg.count; i++) {
        const pid = slots[cfg.role]?.[i];
        if (pid) slotData.push({ role: cfg.role, slotIndex: i, playerId: pid });
      }
    }
    startTransition(async () => {
      await saveLineup(matchId, formation, slotData, notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const assigned = getAssigned();

  return (
    <div className="space-y-6">
      {/* Formation selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Formation :</span>
        {Object.keys(FORMATIONS).map((f) => (
          <button
            key={f}
            onClick={() => changeFormation(f)}
            className={cn(
              "rounded-lg px-3 py-1 text-sm font-semibold transition-colors",
              formation === f
                ? "bg-club text-white"
                : "border bg-secondary hover:bg-secondary/80",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Pitch */}
      <div
        className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl"
        style={{ background: "linear-gradient(180deg,#15803d 0%,#16a34a 50%,#15803d 100%)", aspectRatio: "9/14" }}
      >
        {/* Terrain : lignes */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
          viewBox="0 0 100 155"
          preserveAspectRatio="none"
        >
          {/* Contour */}
          <rect x="5" y="5" width="90" height="145" fill="none" stroke="white" strokeWidth="1" />
          {/* Ligne médiane */}
          <line x1="5" y1="77.5" x2="95" y2="77.5" stroke="white" strokeWidth="0.8" />
          <circle cx="50" cy="77.5" r="12" fill="none" stroke="white" strokeWidth="0.8" />
          {/* Surface réparation bas (GK) */}
          <rect x="25" y="130" width="50" height="20" fill="none" stroke="white" strokeWidth="0.8" />
          <rect x="35" y="142" width="30" height="8" fill="none" stroke="white" strokeWidth="0.8" />
          {/* Surface réparation haut */}
          <rect x="25" y="5" width="50" height="20" fill="none" stroke="white" strokeWidth="0.8" />
          <rect x="35" y="5" width="30" height="8" fill="none" stroke="white" strokeWidth="0.8" />
        </svg>

        {/* Slots joueurs */}
        {config.map((cfg) =>
          Array.from({ length: cfg.count }, (_, i) => {
            const x = slotX(cfg.count, i);
            const pid = slots[cfg.role]?.[i] ?? "";
            const p = players.find((pl) => pl.id === pid);
            return (
              <div
                key={`${cfg.role}-${i}`}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${cfg.y}%` }}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div className="grid size-9 place-items-center rounded-full border-2 border-white bg-navy-900 text-xs font-bold text-white shadow-lg">
                    {p ? (p.number != null ? `#${p.number}` : cfg.label) : cfg.label}
                  </div>
                  {p && (
                    <span className="max-w-[56px] truncate rounded bg-black/60 px-1 text-[9px] font-semibold text-white">
                      {p.lastName}
                    </span>
                  )}
                </div>
              </div>
            );
          }),
        )}
      </div>

      {/* Sélecteurs par poste */}
      <div className="space-y-4">
        {config.map((cfg) => (
          <div key={cfg.role}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {cfg.label === "G" ? "Gardien" : cfg.label === "D" ? "Défenseurs" : cfg.label === "M" ? "Milieux" : cfg.label === "MD" ? "Milieux défensifs" : cfg.label === "MA" ? "Milieux offensifs" : "Attaquants"}
            </p>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cfg.count}, minmax(0, 1fr))` }}>
              {Array.from({ length: cfg.count }, (_, i) => {
                const pid = slots[cfg.role]?.[i] ?? "";
                return (
                  <select
                    key={i}
                    value={pid}
                    onChange={(e) => setSlot(cfg.role, i, e.target.value)}
                    className="w-full rounded-lg border bg-background px-2 py-1.5 text-xs outline-none focus:border-club"
                  >
                    <option value="">— Poste {i + 1} —</option>
                    {players.map((p) => (
                      <option
                        key={p.id}
                        value={p.id}
                        disabled={assigned.has(p.id) && pid !== p.id}
                      >
                        {p.number != null ? `#${p.number} ` : ""}{p.firstName[0]}. {p.lastName}
                      </option>
                    ))}
                  </select>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes tactiques (optionnel)…"
        rows={2}
        className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-club"
      />

      <Button onClick={submit} disabled={pending} className="w-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {saved ? "Sauvegardé !" : "Enregistrer la compo"}
      </Button>
    </div>
  );
}
