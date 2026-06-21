"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Sparkles, Target, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Crest } from "@/components/brand/crest";

const KEY = "assjm_onboarded_v1";

const STEPS = [
  { icon: TrendingUp, title: "Ta carte FUT", text: "Chaque membre a sa carte façon Ultimate Team. Fais-la évoluer en gagnant des points." },
  { icon: Brain, title: "Quiz ASSJM", text: "10 questions sur le foot et l'histoire du club chaque jour — jusqu'à 50 pts à gagner !" },
  { icon: Target, title: "Pronostique", text: "Devine le score des matchs et grimpe dans la Ligue des pronostiqueurs." },
  { icon: Sparkles, title: "Défie & gagne", text: "Duels de pénaltys, packs hebdos et classements : tout pour faire évoluer ta carte." },
];

export function WelcomeModal() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    try {
      if (!window.localStorage.getItem(KEY)) setShow(true);
    } catch {}
  }, []);

  function close() {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {}
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border bg-card p-6 shadow-card-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={close} className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-secondary" aria-label="Fermer">
              <X className="size-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <Crest className="h-14 w-auto" />
              <h2 className="mt-3 font-display text-2xl font-extrabold">Bienvenue sur ASSJM HUB&nbsp;!</h2>
              <p className="mt-1 text-sm text-muted-foreground">Voici ce qui t'attend dans ton espace membre.</p>
            </div>

            <div className="mt-5 space-y-3">
              {STEPS.map((s) => (
                <div key={s.title} className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-club/10 text-club">
                    <s.icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={close} size="lg" className="mt-6 w-full">
              <Sparkles className="size-4" /> C'est parti !
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
