"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Crest } from "@/components/brand/crest";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En production, brancher ici un service de suivi d'erreurs (Sentry…)
    console.error(error);
  }, [error]);

  return (
    <div className="relative grid min-h-[80vh] place-items-center overflow-hidden bg-navy-950 px-6 py-20 text-white">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-club/20 blur-[120px]" />

      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        <Crest className="h-16 w-auto opacity-90 drop-shadow-2xl" />

        <span className="mt-8 grid size-16 place-items-center rounded-2xl border border-white/15 bg-white/5 text-3xl">
          ⚠️
        </span>

        <h1 className="mt-6 font-display text-2xl font-bold sm:text-3xl">
          Une erreur est survenue
        </h1>
        <p className="mt-3 text-blue-100/70">
          Quelque chose s'est mal passé de notre côté. Vous pouvez réessayer —
          si le souci persiste, revenez un peu plus tard.
        </p>

        {error.digest && (
          <code className="mt-4 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-blue-100/50">
            réf. {error.digest}
          </code>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={reset}>
            <RotateCcw className="size-4" />
            Réessayer
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/">
              <Home className="size-4" />
              Accueil
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
