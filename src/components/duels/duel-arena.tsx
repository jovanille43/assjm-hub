"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Loader2,
  RotateCcw,
  Swords,
  Target,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "@/components/ui/toast";
import {
  createDuel,
  declineDuel,
  playDuel,
  type DuelSummary,
  type Opponent,
} from "@/app/dashboard/duels/actions";
import { ZONE_COUNT, ZONE_LABELS, SHOTS_PER_DUEL } from "@/lib/duels";
import { cn } from "@/lib/utils";

const STAKES = [0, 20, 50];

/* ── But à 6 zones ─────────────────────────────────────────────────────────── */
function PenaltyGoal({
  marks,
  mode,
  onPick,
}: {
  marks: number[];
  mode: "shoot" | "dive";
  onPick: (zone: number) => void;
}) {
  const icon = mode === "shoot" ? "⚽" : "🧤";
  const counts = Array.from({ length: ZONE_COUNT }, (_, z) => marks.filter((m) => m === z).length);

  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* Cadre + filet */}
      <div className="rounded-t-xl border-[6px] border-b-0 border-white/85 bg-[repeating-linear-gradient(90deg,transparent,transparent_18px,rgba(255,255,255,0.08)_18px,rgba(255,255,255,0.08)_19px),repeating-linear-gradient(0deg,transparent,transparent_18px,rgba(255,255,255,0.08)_18px,rgba(255,255,255,0.08)_19px)] p-2">
        <div className="grid grid-cols-3 grid-rows-2 gap-2">
          {Array.from({ length: ZONE_COUNT }, (_, z) => (
            <button
              key={z}
              type="button"
              onClick={() => onPick(z)}
              className={cn(
                "relative grid aspect-[4/3] place-items-center rounded-lg border text-2xl transition-all",
                counts[z] > 0
                  ? "border-club bg-club/15 scale-[0.98]"
                  : "border-white/15 bg-white/[0.03] hover:border-club/60 hover:bg-club/10 active:scale-95",
              )}
              aria-label={ZONE_LABELS[z]}
            >
              {counts[z] > 0 ? (
                <span className="flex items-center gap-0.5">
                  <span>{icon}</span>
                  {counts[z] > 1 && (
                    <span className="text-xs font-bold text-club">×{counts[z]}</span>
                  )}
                </span>
              ) : (
                <span className="text-[10px] font-medium uppercase tracking-wide text-white/30">
                  {ZONE_LABELS[z].split(" ")[0]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      {/* Ligne de but / herbe */}
      <div className="h-2 rounded-b-xl bg-gradient-to-b from-emerald-700/70 to-emerald-900/70" />
    </div>
  );
}

/* ── Sélecteur : 5 tirs puis 5 plongeons ───────────────────────────────────── */
function PenaltyPicker({
  title,
  submitLabel,
  busy,
  onSubmit,
  onCancel,
}: {
  title: string;
  submitLabel: string;
  busy: boolean;
  onSubmit: (shots: number[], dives: number[]) => void;
  onCancel: () => void;
}) {
  const [shots, setShots] = React.useState<number[]>([]);
  const [dives, setDives] = React.useState<number[]>([]);

  const mode: "shoot" | "dive" = shots.length < SHOTS_PER_DUEL ? "shoot" : "dive";
  const ready = shots.length === SHOTS_PER_DUEL && dives.length === SHOTS_PER_DUEL;
  const current = mode === "shoot" ? shots : dives;

  function pick(zone: number) {
    if (mode === "shoot") setShots((s) => (s.length < SHOTS_PER_DUEL ? [...s, zone] : s));
    else setDives((d) => (d.length < SHOTS_PER_DUEL ? [...d, zone] : d));
  }
  function reset() {
    setShots([]);
    setDives([]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onCancel} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Retour
        </button>
        <p className="font-display text-sm font-bold">{title}</p>
      </div>

      <div className="rounded-2xl border bg-navy-950 p-4 text-white">
        <div className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold">
          {mode === "shoot" ? (
            <>
              <Target className="size-4 text-club" /> Place tes 5 tirs
            </>
          ) : (
            <>
              <span className="text-base">🧤</span> Place tes 5 plongeons (en gardien)
            </>
          )}
          <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-xs tabular-nums">
            {current.length}/{SHOTS_PER_DUEL}
          </span>
        </div>

        <PenaltyGoal marks={current} mode={mode} onPick={pick} />

        {/* Récap des deux séries */}
        <div className="mt-4 space-y-2 text-xs">
          <SeriePreview label="Tirs" icon="⚽" zones={shots} />
          <SeriePreview label="Plongeons" icon="🧤" zones={dives} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={reset} disabled={busy} className="flex-1">
          <RotateCcw className="size-4" /> Recommencer
        </Button>
        <Button onClick={() => onSubmit(shots, dives)} disabled={!ready || busy} className="flex-1">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

function SeriePreview({ label, icon, zones }: { label: string; icon: string; zones: number[] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-white/50">{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: SHOTS_PER_DUEL }, (_, i) => (
          <span
            key={i}
            className={cn(
              "grid size-6 place-items-center rounded-md text-[11px]",
              zones[i] != null ? "bg-club/20" : "bg-white/5 text-white/20",
            )}
            title={zones[i] != null ? ZONE_LABELS[zones[i]] : undefined}
          >
            {zones[i] != null ? icon : i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Écran de résultat ─────────────────────────────────────────────────────── */
function ResultScreen({ result, onClose }: { result: DuelSummary; onClose: () => void }) {
  const config = {
    WIN: { title: "Victoire ! 🎉", color: "text-emerald-400", emoji: "🏆" },
    LOSS: { title: "Défaite", color: "text-club", emoji: "😤" },
    DRAW: { title: "Match nul", color: "text-amber-400", emoji: "🤝" },
    PENDING: { title: "", color: "", emoji: "" },
  }[result.outcome];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border bg-navy-950 p-8 text-center text-white"
    >
      <div className="text-6xl">{config.emoji}</div>
      <h3 className={cn("mt-3 font-display text-2xl font-extrabold", config.color)}>{config.title}</h3>
      <div className="mt-4 flex items-center justify-center gap-4 font-display text-4xl font-extrabold tabular-nums">
        <span>{result.myGoals}</span>
        <span className="text-white/30">—</span>
        <span>{result.theirGoals}</span>
      </div>
      <p className="mt-1 text-xs text-white/50">tes buts · ses buts</p>
      {result.outcome === "WIN" && (
        <p className="mt-4 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-300">
          <Zap className="size-4" /> +{result.stake * 2 + 10 - result.stake} pts gagnés
        </p>
      )}
      <Button onClick={onClose} variant="outline" className="mt-6 border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white">
        Continuer
      </Button>
    </motion.div>
  );
}

/* ── Arène ─────────────────────────────────────────────────────────────────── */
type View =
  | { kind: "lobby" }
  | { kind: "create"; opponent: Opponent; stake: number }
  | { kind: "respond"; duel: DuelSummary }
  | { kind: "result"; result: DuelSummary };

export function DuelArena({
  myPoints,
  opponents,
  incoming,
  outgoing,
  history,
}: {
  myPoints: number;
  opponents: Opponent[];
  incoming: DuelSummary[];
  outgoing: DuelSummary[];
  history: DuelSummary[];
}) {
  const router = useRouter();
  const [view, setView] = React.useState<View>({ kind: "lobby" });
  const [stake, setStake] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const wins = history.filter((h) => h.outcome === "WIN").length;
  const losses = history.filter((h) => h.outcome === "LOSS").length;

  async function submitCreate(opponent: Opponent, st: number, shots: number[], dives: number[]) {
    setBusy(true);
    const res = await createDuel({ opponentId: opponent.id, stake: st, shots, dives });
    setBusy(false);
    if (res.error) return toast.error(res.error);
    toast.success(`Défi envoyé à ${opponent.name} !`, {
      description: st > 0 ? `Mise : ${st} pts` : "Sans mise",
    });
    setView({ kind: "lobby" });
    router.refresh();
  }

  async function submitPlayDuel(duel: DuelSummary, shots: number[], dives: number[]) {
    setBusy(true);
    const res = await playDuel({ duelId: duel.id, shots, dives });
    setBusy(false);
    if (res.error || !res.result) return toast.error(res.error ?? "Erreur");
    const r = { ...res.result, opponentName: duel.opponentName };
    setView({ kind: "result", result: r });
    router.refresh();
  }

  async function decline(duel: DuelSummary) {
    setBusy(true);
    const res = await declineDuel(duel.id);
    setBusy(false);
    if (res.error) return toast.error(res.error);
    toast.success("Défi refusé");
    router.refresh();
  }

  // ── Vue : création (choix tirs/plongeons) ──
  if (view.kind === "create") {
    return (
      <PenaltyPicker
        title={`Défi à ${view.opponent.name}`}
        submitLabel="Envoyer le défi"
        busy={busy}
        onSubmit={(s, d) => submitCreate(view.opponent, view.stake, s, d)}
        onCancel={() => setView({ kind: "lobby" })}
      />
    );
  }

  if (view.kind === "respond") {
    return (
      <PenaltyPicker
        title={`Défi de ${view.duel.opponentName}`}
        submitLabel="Tirer au but !"
        busy={busy}
        onSubmit={(s, d) => submitPlayDuel(view.duel, s, d)}
        onCancel={() => setView({ kind: "lobby" })}
      />
    );
  }

  if (view.kind === "result") {
    return <ResultScreen result={view.result} onClose={() => setView({ kind: "lobby" })} />;
  }

  const filtered = opponents.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Bandeau stats perso */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="flex flex-col items-center p-3">
          <span className="font-display text-2xl font-extrabold text-emerald-400">{wins}</span>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Victoires</span>
        </Card>
        <Card className="flex flex-col items-center p-3">
          <span className="font-display text-2xl font-extrabold text-club">{losses}</span>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Défaites</span>
        </Card>
        <Card className="flex flex-col items-center p-3">
          <span className="font-display text-2xl font-extrabold">{myPoints}</span>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Points</span>
        </Card>
      </div>

      {/* Défis reçus */}
      {incoming.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
            <Swords className="size-5 text-club" /> Défis reçus
            <span className="rounded-full bg-club px-2 py-0.5 text-xs font-bold text-white">{incoming.length}</span>
          </h2>
          <div className="space-y-2">
            {incoming.map((d) => (
              <Card key={d.id} className="flex items-center gap-3 p-3">
                <Avatar name={d.opponentName} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{d.opponentName} te défie</p>
                  <p className="text-xs text-muted-foreground">
                    {d.stake > 0 ? `Mise : ${d.stake} pts` : "Sans mise"}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => decline(d)} disabled={busy} className="size-9 p-0">
                  <X className="size-4" />
                </Button>
                <Button size="sm" onClick={() => setView({ kind: "respond", duel: d })} disabled={busy}>
                  <Target className="size-4" /> Relever
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Nouveau défi */}
      <section>
        <h2 className="mb-2 font-display text-lg font-bold">Lancer un défi</h2>

        {/* Mise */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Mise :</span>
          {STAKES.map((s) => (
            <button
              key={s}
              onClick={() => setStake(s)}
              disabled={s > myPoints}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-semibold transition-colors disabled:opacity-40",
                stake === s ? "bg-club text-white" : "border hover:border-club",
              )}
            >
              {s === 0 ? "Amical" : `${s} pts`}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un adversaire…"
          className="mb-2 w-full rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-sm outline-none focus:border-club"
        />
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Aucun adversaire trouvé.</p>
          ) : (
            filtered.map((o) => (
              <Card key={o.id} className="flex items-center gap-3 p-3">
                <Avatar name={o.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{o.name}</p>
                  <p className="text-xs text-muted-foreground">Carte {o.ovr}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setView({ kind: "create", opponent: o, stake })}
                  disabled={busy}
                >
                  <Swords className="size-4" /> Défier
                </Button>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Défis envoyés en attente */}
      {outgoing.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-lg font-bold">En attente de réponse</h2>
          <div className="space-y-2">
            {outgoing.map((d) => (
              <Card key={d.id} className="flex items-center gap-3 p-3">
                <Avatar name={d.opponentName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{d.opponentName}</p>
                  <p className="text-xs text-muted-foreground">{d.stake > 0 ? `${d.stake} pts en jeu` : "Amical"}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => decline(d)} disabled={busy} className="text-muted-foreground">
                  Annuler
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Historique */}
      {history.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
            <Trophy className="size-5 text-club" /> Historique
          </h2>
          <div className="space-y-1.5">
            {history.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2 text-sm">
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                    d.outcome === "WIN" ? "bg-emerald-500/20 text-emerald-400"
                      : d.outcome === "LOSS" ? "bg-club/20 text-club"
                      : "bg-amber-500/20 text-amber-400",
                  )}
                >
                  {d.outcome === "WIN" ? "V" : d.outcome === "LOSS" ? "D" : "N"}
                </span>
                <span className="flex-1 truncate">{d.opponentName}</span>
                <span className="tabular-nums font-semibold">
                  {d.myGoals}–{d.theirGoals}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
