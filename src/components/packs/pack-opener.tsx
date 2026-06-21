"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Zap, Crown, Lock } from "lucide-react";
import { openPack, type PackReward, type PackType } from "@/app/dashboard/packs/actions";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Crest } from "@/components/brand/crest";
import { RARITY } from "@/lib/enums";
import { cn } from "@/lib/utils";

type Phase = "idle" | "opening" | "revealed";

const PACK_INFO = {
  STANDARD: {
    label: "Pack Standard",
    sublabel: "Gratuit — 3 par semaine",
    icon: Sparkles,
    gradient: "from-navy-700 via-navy-800 to-navy-900",
    border: "border-white/20",
    color: "text-white",
    tagColor: "bg-white/15 text-white",
  },
  PRO: {
    label: "Pack Pro",
    sublabel: "100 pts — RARE minimum",
    icon: Zap,
    gradient: "from-blue-800 via-blue-900 to-navy-900",
    border: "border-blue-400/40",
    color: "text-blue-300",
    tagColor: "bg-blue-500/20 text-blue-300",
  },
  ELITE: {
    label: "Pack Élite",
    sublabel: "250 pts — ÉPIQUE minimum",
    icon: Crown,
    gradient: "from-purple-800 via-purple-900 to-navy-900",
    border: "border-purple-400/40",
    color: "text-purple-300",
    tagColor: "bg-purple-500/20 text-purple-300",
  },
} as const;

export function PackOpener({
  weeklyUsed,
  weeklyMax,
  userPoints,
}: {
  weeklyUsed: number;
  weeklyMax: number;
  userPoints: number;
}) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<PackType>("STANDARD");
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [reward, setReward] = React.useState<PackReward | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const standardFull = weeklyUsed >= weeklyMax;
  const canOpen =
    selected === "STANDARD"
      ? !standardFull
      : selected === "PRO"
        ? userPoints >= 100
        : userPoints >= 250;

  async function open() {
    setPhase("opening");
    setError(null);
    try {
      const [res] = await Promise.all([
        openPack(selected),
        new Promise((r) => setTimeout(r, 1600)),
      ]);
      setReward(res);
      setPhase("revealed");
      router.refresh();
      const extras = [
        res.pronoBoosts > 0 ? `+${res.pronoBoosts} boost Prono` : null,
      ].filter(Boolean).join(" · ");
      toast.success(`${res.label} ! +${res.points} pts`, {
        description: extras || undefined,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur lors de l'ouverture.";
      setError(msg);
      toast.error(msg);
      setPhase("idle");
    }
  }

  function again() {
    setReward(null);
    setPhase("idle");
  }

  const info = PACK_INFO[selected];
  const r = reward ? RARITY[reward.rarity] ?? RARITY.COMMON : null;

  return (
    <div className="space-y-4">
      {/* Sélecteur de pack */}
      {phase === "idle" && (
        <div className="grid gap-3 sm:grid-cols-3">
          {(["STANDARD", "PRO", "ELITE"] as PackType[]).map((type) => {
            const p = PACK_INFO[type];
            const locked =
              type === "STANDARD"
                ? standardFull
                : type === "PRO"
                  ? userPoints < 100
                  : userPoints < 250;

            return (
              <button
                key={type}
                onClick={() => !locked && setSelected(type)}
                className={cn(
                  "relative rounded-2xl border p-4 text-left transition-all",
                  p.border,
                  selected === type ? "ring-2 ring-club ring-offset-2 ring-offset-background" : "",
                  locked ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]",
                )}
              >
                {locked && <Lock className="absolute right-3 top-3 size-3.5 text-muted-foreground" />}
                <p.icon className={cn("mb-2 size-5", p.color)} />
                <p className={cn("text-sm font-bold", p.color)}>{p.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.sublabel}</p>
                {type === "STANDARD" && (
                  <div className={cn("mt-2 rounded-full px-2 py-0.5 text-[10px] font-bold", p.tagColor)}>
                    {weeklyMax - weeklyUsed}/{weeklyMax} restants
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Zone d'ouverture */}
      <div className="relative grid min-h-[420px] place-items-center overflow-hidden rounded-3xl border bg-navy-950 p-8 text-white">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
          animate={{
            background: r ? `${r.from}55` : "rgba(225,29,42,0.25)",
            scale: phase === "opening" ? [1, 1.4, 1] : 1,
          }}
          transition={{ duration: 1.6, repeat: phase === "opening" ? Infinity : 0 }}
        />

        <AnimatePresence mode="wait">
          {phase !== "revealed" ? (
            <motion.div
              key="pack"
              className="relative z-10 flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
            >
              <motion.div
                className={cn(
                  "relative grid h-64 w-44 place-items-center overflow-hidden rounded-2xl border-2 bg-gradient-to-b shadow-glow",
                  info.gradient,
                  info.border,
                  phase === "idle" && "motion-safe:animate-float",
                )}
                animate={
                  phase === "opening"
                    ? { rotate: [0, -5, 5, -5, 5, -3, 3, 0], y: [0, -6, 0] }
                    : {}
                }
                transition={phase === "opening" ? { duration: 1.6, repeat: Infinity } : {}}
              >
                <div className="absolute inset-0 bg-grid opacity-30" />
                <div className="ribbon-line absolute inset-x-0 top-6 h-1.5 opacity-50" />
                <div className="ribbon-line absolute inset-x-0 bottom-6 h-1.5 opacity-50" />
                <div className="flex flex-col items-center gap-2">
                  <Crest className="relative h-20 w-auto drop-shadow-2xl" />
                  <span className={cn("relative font-display text-xs font-bold uppercase tracking-[0.2em]", info.color)}>
                    {info.label}
                  </span>
                </div>
                <div className="shine absolute inset-0" />
              </motion.div>

              <div className="mt-8 text-center">
                {phase === "idle" ? (
                  <>
                    {error && (
                      <p className="mb-4 max-w-xs rounded-lg bg-club/15 px-4 py-2 text-sm text-red-300">
                        {error}
                      </p>
                    )}
                    <Button size="lg" onClick={open} disabled={!canOpen}>
                      <info.icon className="size-4" />
                      Ouvrir le {info.label}
                      {selected !== "STANDARD" && ` — ${selected === "PRO" ? 100 : 250} pts`}
                    </Button>
                  </>
                ) : (
                  <p className="inline-flex items-center gap-2 text-blue-100/80">
                    <Loader2 className="size-4 animate-spin" /> Ouverture en cours...
                  </p>
                )}
              </div>
            </motion.div>
          ) : (
            reward &&
            r && (
              <motion.div
                key="reward"
                className="relative z-10 flex flex-col items-center"
                initial={{ opacity: 0, scale: 0.4, rotateY: 90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  className="pointer-events-none absolute left-1/2 top-24 size-40 -translate-x-1/2 rounded-full border-2"
                  style={{ borderColor: r.from }}
                  initial={{ scale: 0, opacity: 0.8 }}
                  animate={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />

                <div
                  className="w-56 rounded-[1.6rem] p-[3px] shadow-glow"
                  style={{ background: `linear-gradient(135deg, ${r.from}, ${r.to})` }}
                >
                  <div className="flex flex-col items-center rounded-[1.45rem] bg-gradient-to-b from-navy-800 to-navy-950 px-6 py-8 text-center">
                    <span
                      className="mb-3 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
                      style={{ background: `${r.from}33`, color: r.from }}
                    >
                      {r.label}
                    </span>
                    <motion.div
                      className="text-6xl"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 14 }}
                    >
                      {reward.icon}
                    </motion.div>
                    <h3 className="mt-3 font-display text-xl font-bold">{reward.label}</h3>
                    <p className="mt-1 text-xs text-blue-100/60">{reward.description}</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {reward.points > 0 && (
                        <span className="rounded-full bg-club px-3 py-1 text-sm font-bold">
                          +{reward.points} pts
                        </span>
                      )}
                      {reward.pronoBoosts > 0 && (
                        <span className="rounded-full bg-emerald-500/25 px-3 py-1 text-sm font-bold text-emerald-300">
                          +{reward.pronoBoosts} boost Prono ×2
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="mt-6 border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  onClick={again}
                >
                  Ouvrir un autre pack
                </Button>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
