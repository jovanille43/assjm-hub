"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, TrendingUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { upgradeCard } from "@/app/dashboard/upgrade/actions";
import {
  UPGRADE_BONUS,
  UPGRADE_COSTS,
  UPGRADE_LABELS,
} from "@/components/player/player-card";
import { cn } from "@/lib/utils";

const LEVEL_COLORS = [
  "from-slate-400 to-slate-600",
  "from-amber-700 to-amber-950",
  "from-slate-300 to-slate-500",
  "from-yellow-300 to-amber-600",
  "from-purple-400 to-violet-800",
  "from-amber-300 to-amber-500",
];

const LEVEL_TEXT = [
  "text-slate-300",
  "text-amber-700",
  "text-slate-400",
  "text-yellow-400",
  "text-purple-400",
  "text-amber-300",
];

export function UpgradePanel({
  upgradeLevel,
  userPoints,
}: {
  upgradeLevel: number;
  userPoints: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const nextLevel = upgradeLevel + 1;
  const isMax = upgradeLevel >= 5;
  const cost = isMax ? 0 : UPGRADE_COSTS[nextLevel];
  const canAfford = userPoints >= cost;

  async function handleUpgrade() {
    setLoading(true);
    const res = await upgradeCard();
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(`Carte améliorée en ${UPGRADE_LABELS[nextLevel]} ! ✨`, {
      description: `+${UPGRADE_BONUS[nextLevel]} à toutes tes stats.`,
    });
    router.refresh();
  }

  return (
    <div className="rounded-2xl border bg-secondary/30 p-5">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="size-5 text-club" />
        <h3 className="font-display text-lg font-bold">Améliorer ma carte</h3>
      </div>

      {/* Niveaux */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        {[0, 1, 2, 3, 4, 5].map((lvl) => (
          <div
            key={lvl}
            className={cn(
              "rounded-xl p-2 text-center transition-all",
              lvl <= upgradeLevel
                ? `bg-gradient-to-b ${LEVEL_COLORS[lvl]} text-white`
                : "bg-secondary/50 text-muted-foreground opacity-60",
            )}
          >
            <div className={cn("text-xs font-bold uppercase tracking-wide", lvl <= upgradeLevel ? "text-white" : "")}>
              {UPGRADE_LABELS[lvl]}
            </div>
            <div className="mt-1 text-[10px] opacity-75">
              +{UPGRADE_BONUS[lvl]} pts
            </div>
          </div>
        ))}
      </div>

      {/* Niveau actuel */}
      <p className="mb-3 text-sm text-muted-foreground">
        Niveau actuel :{" "}
        <span className={cn("font-bold", LEVEL_TEXT[upgradeLevel])}>
          {UPGRADE_LABELS[upgradeLevel]}
        </span>
        {upgradeLevel > 0 && (
          <span className="ml-1 text-muted-foreground">
            (+{UPGRADE_BONUS[upgradeLevel]} à toutes les stats)
          </span>
        )}
      </p>

      {/* Action */}
      {isMax ? (
        <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <Sparkles className="size-4" /> Carte au niveau maximum — Légendaire !
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Passer en{" "}
              <span className={cn("font-bold", LEVEL_TEXT[nextLevel])}>
                {UPGRADE_LABELS[nextLevel]}
              </span>
            </span>
            <span className={cn("font-bold", canAfford ? "text-emerald-400" : "text-club")}>
              {cost} pts
            </span>
          </div>

          {!canAfford && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3.5" />
              Il vous manque {cost - userPoints} pts. Ouvrez des packs pour en gagner.
            </p>
          )}

          <Button
            onClick={handleUpgrade}
            disabled={loading || !canAfford}
            className="w-full"
            variant={canAfford ? "default" : "secondary"}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Améliorer ({cost} pts)
          </Button>
        </div>
      )}
    </div>
  );
}
