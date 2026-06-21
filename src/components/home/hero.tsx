"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compact } from "@/lib/utils";

const BallThree = dynamic(() => import("@/components/three/ball-three"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center">
      <div className="size-40 animate-pulse rounded-full bg-gradient-to-br from-navy-500/40 to-club/30 blur-xl" />
    </div>
  ),
});

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function Hero({
  stats,
}: {
  stats: { members: number; players: number; teams: number; goals: number };
}) {
  const chips = [
    { value: compact(stats.players || 0), label: "Licenciés" },
    { value: String(stats.teams || 0), label: "Équipes" },
    { value: compact(stats.goals || 0), label: "Buts marqués" },
  ];

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-navy-950 text-white"
    >
      {/* Couches de fond */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-950 to-navy-950" />
      <div className="absolute inset-0 bg-grid opacity-70" />
      <div className="absolute inset-x-0 top-0 h-[60vh] bg-radial-fade" />
      <div className="pointer-events-none absolute -left-40 top-1/3 size-96 rounded-full bg-club/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 top-10 size-96 rounded-full bg-blue-500/20 blur-[120px]" />
      {/* Ruban passementier diagonal */}
      <div className="ribbon-line absolute left-0 top-24 h-1 w-full rotate-[-4deg] opacity-30 animate-ribbon-slide" />

      <div className="container relative z-10 grid items-center gap-10 pt-28 pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
        {/* Colonne texte */}
        <div>
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100 backdrop-blur"
          >
            <Sparkles className="size-3.5 text-club" />
            Club amateur · Haute-Loire
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl"
          >
            TOUT LE CLUB,
            <br />
            <span className="bg-gradient-to-r from-white via-blue-200 to-club bg-clip-text text-transparent">
              AU MÊME ENDROIT.
            </span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-6 max-w-xl text-lg text-blue-100/80"
          >
            Actualités, résultats, convocations, cartes joueurs et toute la
            communauté de l'ASSJM réunis dans une seule appli — pensée pour
            donner envie de l'ouvrir chaque jour.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <Button asChild size="lg">
              <Link href="/connexion">
                Rejoindre le club <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Link href="/#club">Découvrir l'ASSJM</Link>
            </Button>
          </motion.div>

          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-10 grid max-w-md grid-cols-3 gap-3"
          >
            {chips.map((c) => (
              <div
                key={c.label}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur transition-colors hover:border-club/40"
              >
                <div className="font-display text-3xl font-bold text-white">
                  {c.value}
                </div>
                <div className="mt-0.5 text-[11px] uppercase tracking-wider text-blue-100/60">
                  {c.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Colonne ballon 3D */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-[340px] sm:h-[420px] lg:h-[520px]"
        >
          <div className="absolute inset-0 -z-10 m-auto size-64 rounded-full bg-club/20 blur-[90px]" />
          <BallThree />
          <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center text-[11px] uppercase tracking-widest text-blue-100/40">
            ✋ Glissez pour faire tourner
          </p>
        </motion.div>
      </div>

      {/* Indicateur de scroll */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
      >
        <ChevronDown className="size-6 animate-bounce text-white/40" />
      </motion.div>
    </section>
  );
}
