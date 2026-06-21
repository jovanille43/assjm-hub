import Link from "next/link";
import { ArrowLeft, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Crest } from "@/components/brand/crest";

export default function NotFound() {
  return (
    <div className="relative grid min-h-[80vh] place-items-center overflow-hidden bg-navy-950 px-6 py-20 text-white">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-club/20 blur-[120px]" />
      <div className="ribbon-line absolute inset-x-0 top-0 h-1.5 opacity-50" />
      <div className="ribbon-line absolute inset-x-0 bottom-0 h-1.5 opacity-50" />

      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        <Crest className="h-20 w-auto drop-shadow-2xl" />

        <p className="mt-8 font-display text-[7rem] font-extrabold leading-none tracking-tighter text-white/90">
          4<span className="text-club">0</span>4
        </p>

        <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
          Hors-jeu&nbsp;!
        </h1>
        <p className="mt-3 text-blue-100/70">
          Cette page n'existe pas ou a été déplacée. L'arbitre a sifflé : on
          revient sur le terrain.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="size-4" />
              Retour à l'accueil
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/joueurs">
              <Search className="size-4" />
              Voir les joueurs
            </Link>
          </Button>
        </div>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-blue-100/60 transition-colors hover:text-club"
        >
          <ArrowLeft className="size-4" />
          Mon espace membre
        </Link>
      </div>
    </div>
  );
}
