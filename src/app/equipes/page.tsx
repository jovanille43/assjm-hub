import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { getTeams } from "@/lib/teams";
import { CATEGORIES } from "@/lib/enums";
import { Crest } from "@/components/brand/crest";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Équipes",
  description: "Toutes les équipes de l'AS Saint-Just-Malmont, des jeunes aux vétérans.",
};

export default async function EquipesPage() {
  const teams = await getTeams();

  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 pb-16 pt-28 text-white md:pt-32">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900 to-navy-950" />
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="pointer-events-none absolute -right-20 top-0 size-80 rounded-full bg-club/20 blur-[110px]" />
        <div className="container relative">
          <span className="eyebrow text-club">
            <span className="h-px w-6 bg-club" />
            Le club
          </span>
          <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">
            Nos <span className="text-club">équipes</span>
          </h1>
          <p className="mt-3 max-w-xl text-blue-100/70">
            De l'école de foot aux vétérans, découvre tous les effectifs qui font
            vivre l'ASSJM.
          </p>
        </div>
      </section>

      <section className="section">
        {teams.length === 0 ? (
          <p className="text-muted-foreground">Aucune équipe pour le moment.</p>
        ) : (
          <StaggerGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((t) => (
              <StaggerItem key={t.id}>
                <Link
                  href={`/equipes/${t.slug}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1.5 hover:border-club/40 hover:shadow-card"
                >
                  <div
                    className="absolute right-0 top-0 h-24 w-24 rounded-bl-[3rem] opacity-10 transition-opacity group-hover:opacity-20"
                    style={{ background: t.color ?? "#E11D2A" }}
                  />
                  <Crest className="h-12 w-auto" />
                  <span className="mt-4 inline-flex w-fit rounded-full bg-club/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-club">
                    {CATEGORIES[t.category] ?? t.category}
                  </span>
                  <h2 className="mt-3 font-display text-2xl font-bold">{t.name}</h2>
                  {t.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {t.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Users className="size-4" />
                      {t._count.players} joueurs
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-club">
                      Voir l'effectif
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </section>
    </>
  );
}
