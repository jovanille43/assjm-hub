import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getTeams } from "@/lib/teams";
import { PlayerCard } from "@/components/player/player-card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Cartes joueurs",
  description: "Toutes les cartes joueurs façon Ultimate Team de l'ASSJM.",
};

export default async function JoueursPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team: teamSlug } = await searchParams;
  const [teams, players] = await Promise.all([
    getTeams(),
    db.player.findMany({
      where: teamSlug ? { team: { slug: teamSlug } } : { teamId: { not: null } },
      include: { team: true, user: { select: { image: true } } },
      orderBy: [{ number: "asc" }],
    }),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 pb-14 pt-28 text-white md:pt-32">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900 to-navy-950" />
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="pointer-events-none absolute -right-20 top-0 size-80 rounded-full bg-club/20 blur-[110px]" />
        <div className="container relative">
          <span className="eyebrow text-club">
            <span className="h-px w-6 bg-club" />
            Ultimate Team ASSJM
          </span>
          <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">
            Les <span className="text-club">cartes joueurs</span>
          </h1>
          <p className="mt-3 max-w-xl text-blue-100/70">
            Chaque licencié a sa carte façon FUT, générée à partir de ses
            statistiques.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/joueurs"
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                !teamSlug
                  ? "border-club bg-club text-white"
                  : "border-white/20 bg-white/5 hover:border-club",
              )}
            >
              Toutes
            </Link>
            {teams.map((t) => (
              <Link
                key={t.id}
                href={`/joueurs?team=${t.slug}`}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  teamSlug === t.slug
                    ? "border-club bg-club text-white"
                    : "border-white/20 bg-white/5 hover:border-club",
                )}
              >
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-12">
        {players.length === 0 ? (
          <p className="text-muted-foreground">Aucun joueur dans cette catégorie.</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {players.map((p) => (
              <Link
                key={p.id}
                href={`/joueurs/${p.id}`}
                className="transition-transform hover:scale-[1.02]"
              >
                <PlayerCard player={{ ...p, photo: p.photo ?? p.user?.image ?? null }} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
