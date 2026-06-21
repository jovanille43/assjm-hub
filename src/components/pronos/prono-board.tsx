"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, Loader2, Minus, Plus, Target, Trophy, Zap, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import {
  submitPrediction,
  setMatchResult,
  type UpcomingMatch,
  type ResolvedPrediction,
  type AwaitingMatch,
} from "@/app/dashboard/pronos/actions";
import { cn } from "@/lib/utils";

function fmtDate(iso: string) {
  return format(new Date(iso), "EEE d MMM · HH'h'mm", { locale: fr });
}

function Stepper({
  value,
  set,
  disabled,
}: {
  value: number;
  set: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => set(Math.max(0, value - 1))}
        disabled={disabled || value <= 0}
        className="grid size-8 place-items-center rounded-lg border transition-colors hover:border-club disabled:opacity-40"
        aria-label="moins"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-7 text-center font-display text-2xl font-extrabold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => set(Math.min(30, value + 1))}
        disabled={disabled}
        className="grid size-8 place-items-center rounded-lg border transition-colors hover:border-club disabled:opacity-40"
        aria-label="plus"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

function MatchPredictor({ match, myBoosts }: { match: UpcomingMatch; myBoosts: number }) {
  const router = useRouter();
  const [forG, setForG] = React.useState(match.myPred?.predFor ?? 1);
  const [against, setAgainst] = React.useState(match.myPred?.predAgainst ?? 1);
  const [useBoost, setUseBoost] = React.useState(match.myPred?.boosted ?? false);
  const [busy, setBusy] = React.useState(false);

  const alreadyBoosted = match.myPred?.boosted ?? false;
  const canBoost = alreadyBoosted || myBoosts > 0;

  async function save() {
    setBusy(true);
    const res = await submitPrediction({
      matchId: match.id,
      predFor: forG,
      predAgainst: against,
      useBoost,
    });
    setBusy(false);
    if (res.error) return toast.error(res.error);
    toast.success(match.myPred ? "Pronostic mis à jour" : "Pronostic enregistré", {
      description: res.boostUsed ? "Boost ×2 activé !" : undefined,
    });
    router.refresh();
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {fmtDate(match.date)}
            {match.competition ? ` · ${match.competition}` : ""}
          </p>
          <p className="truncate text-sm font-semibold">
            {match.teamName} <span className="text-muted-foreground">vs</span> {match.opponent}
          </p>
        </div>
        <Badge variant={match.venue === "HOME" ? "navy" : "secondary"}>
          {match.venue === "HOME" ? "Domicile" : "Extérieur"}
        </Badge>
      </div>

      <div className="flex items-center justify-center gap-4 rounded-xl bg-secondary/30 py-3">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] font-semibold uppercase text-club">ASSJM</span>
          <Stepper value={forG} set={setForG} disabled={busy} />
        </div>
        <span className="font-display text-xl text-muted-foreground">—</span>
        <div className="flex flex-col items-center gap-1">
          <span className="max-w-[6rem] truncate text-[11px] font-semibold uppercase text-muted-foreground">
            {match.opponent}
          </span>
          <Stepper value={against} set={setAgainst} disabled={busy} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => canBoost && !alreadyBoosted && setUseBoost((b) => !b)}
          disabled={!canBoost || alreadyBoosted}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            useBoost ? "bg-emerald-500/20 text-emerald-300" : "border text-muted-foreground hover:border-club",
            (!canBoost || alreadyBoosted) && "cursor-default",
          )}
          title={alreadyBoosted ? "Boost déjà activé" : myBoosts > 0 ? "Double les points" : "Aucun boost disponible"}
        >
          <Zap className="size-3.5" />
          {alreadyBoosted ? "Boost ×2 actif" : `Boost ×2 (${myBoosts})`}
        </button>
        <Button size="sm" onClick={save} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {match.myPred ? "Modifier" : "Valider"}
        </Button>
      </div>
    </Card>
  );
}

function ResultEntry({ match }: { match: AwaitingMatch }) {
  const router = useRouter();
  const [forG, setForG] = React.useState(0);
  const [against, setAgainst] = React.useState(0);
  const [busy, setBusy] = React.useState(false);

  async function save() {
    setBusy(true);
    const res = await setMatchResult({ matchId: match.id, scoreFor: forG, scoreAgainst: against });
    setBusy(false);
    if (res.error) return toast.error(res.error);
    toast.success("Résultat enregistré — pronostics réglés !");
    router.refresh();
  }

  return (
    <Card className="p-4">
      <p className="mb-2 truncate text-sm font-semibold">
        {match.teamName} vs {match.opponent}
      </p>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Stepper value={forG} set={setForG} disabled={busy} />
          <span className="text-muted-foreground">—</span>
          <Stepper value={against} set={setAgainst} disabled={busy} />
        </div>
        <Button size="sm" onClick={save} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Valider
        </Button>
      </div>
    </Card>
  );
}

export function PronoBoard({
  myPoints,
  myBoosts,
  isStaff,
  upcoming,
  resolved,
  awaiting,
}: {
  myPoints: number;
  myBoosts: number;
  isStaff: boolean;
  upcoming: UpcomingMatch[];
  resolved: ResolvedPrediction[];
  awaiting: AwaitingMatch[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col items-center p-3">
          <span className="font-display text-2xl font-extrabold">{myPoints}</span>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Points</span>
        </Card>
        <Card className="flex flex-col items-center p-3">
          <span className="font-display text-2xl font-extrabold text-emerald-400">{myBoosts}</span>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Boosts ×2</span>
        </Card>
      </div>

      {/* Staff : saisie des résultats */}
      {isStaff && awaiting.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
            <ClipboardCheck className="size-5 text-club" /> Saisir un résultat
          </h2>
          <p className="mb-2 text-xs text-muted-foreground">
            Entre le score final : les pronostics seront réglés automatiquement.
          </p>
          <div className="space-y-2">
            {awaiting.map((m) => (
              <ResultEntry key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Matchs à pronostiquer */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
          <Target className="size-5 text-club" /> Prochains matchs
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Score exact = <strong className="text-foreground">{50} pts</strong> · bon résultat ={" "}
          <strong className="text-foreground">{15} pts</strong>. Modifiable jusqu'au coup d'envoi.
        </p>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Aucun match à pronostiquer pour le moment. Reviens bientôt !
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((m) => (
              <MatchPredictor key={m.id} match={m} myBoosts={myBoosts} />
            ))}
          </div>
        )}
      </section>

      {/* Historique */}
      {resolved.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
            <Trophy className="size-5 text-club" /> Mes pronostics passés
          </h2>
          <div className="space-y-1.5">
            {resolved.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2 text-sm">
                <span className="flex-1 truncate">
                  {r.opponent}
                  <span className="ml-2 text-xs text-muted-foreground">
                    pronostic {r.predFor}–{r.predAgainst} · réel {r.scoreFor}–{r.scoreAgainst}
                  </span>
                </span>
                {r.boosted && <Zap className="size-3.5 text-emerald-400" />}
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold",
                    r.awardedPoints > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {r.awardedPoints > 0 ? `+${r.awardedPoints}` : "0"} pts
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
