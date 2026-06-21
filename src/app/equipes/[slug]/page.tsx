import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, Shield } from "lucide-react";
import { getTeamBySlug } from "@/lib/teams";
import { CATEGORIES, POSITIONS } from "@/lib/enums";
import { Crest } from "@/components/brand/crest";
import { Reveal } from "@/components/motion/reveal";
import { initials, overall as calcOverall } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const team = await getTeamBySlug(slug);
  return { title: team ? team.name : "Équipe" };
}

const POSITION_ORDER = ["GK", "DEF", "MID", "FWD"] as const;

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const team = await getTeamBySlug(slug);
  if (!team) notFound();

  const grouped = POSITION_ORDER.map((pos) => ({
    pos,
    label: POSITIONS[pos].label,
    color: POSITIONS[pos].color,
    players: team.players.filter((p) => p.position === pos),
  })).filter((g) => g.players.length > 0);

  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 pb-14 pt-28 text-white md:pt-32">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900 to-navy-950" />
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="ribbon-line absolute inset-x-0 bottom-0 h-1.5 opacity-40 animate-ribbon-slide" />
        <div className="container relative">
          <Link
            href="/equipes"
            className="inline-flex items-center gap-1.5 text-sm text-blue-100/70 transition-colors hover:text-club"
          >
            <ArrowLeft className="size-4" /> Toutes les équipes
          </Link>
          <div className="mt-4 flex items-center gap-5">
            <Crest className="h-20 w-auto" />
            <div>
              <span className="inline-flex rounded-full bg-club/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-club">
                {CATEGORIES[team.category] ?? team.category}
              </span>
              <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">
                {team.name}
              </h1>
              <p className="mt-1 text-sm text-blue-100/60">
                Saison {team.season} · {team.players.length} joueurs
              </p>
            </div>
          </div>
          {team.description && (
            <p className="mt-5 max-w-2xl text-blue-100/70">{team.description}</p>
          )}
        </div>
      </section>

      <div className="container grid gap-8 py-12 lg:grid-cols-[1fr_300px]">
        {/* Effectif */}
        <div className="space-y-8">
          {grouped.length === 0 && (
            <p className="text-muted-foreground">Effectif à venir.</p>
          )}
          {grouped.map((group) => (
            <Reveal key={group.pos}>
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="size-3 rounded-full"
                  style={{ background: group.color }}
                />
                <h2 className="font-display text-lg font-bold uppercase tracking-wide">
                  {group.label}s
                </h2>
                <span className="text-sm text-muted-foreground">
                  ({group.players.length})
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.players.map((p) => {
                  const ovr = calcOverall(p);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-club/40"
                    >
                      <span className="w-7 text-center font-display text-lg font-bold text-muted-foreground">
                        {p.number ?? "—"}
                      </span>
                      <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-navy-600 to-navy-900 text-xs font-bold text-white">
                        {initials(`${p.firstName} ${p.lastName}`)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {p.firstName} {p.lastName}
                        </p>
                        <p
                          className="text-xs font-medium"
                          style={{ color: group.color }}
                        >
                          {POSITIONS[p.position as keyof typeof POSITIONS]?.short ?? p.position}
                        </p>
                      </div>
                      <span className="grid size-9 place-items-center rounded-lg bg-navy font-display text-sm font-bold text-white">
                        {ovr}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          ))}
        </div>

        {/* Staff */}
        <aside>
          <div className="sticky top-24 rounded-2xl border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
              <ClipboardList className="size-5 text-club" /> Encadrement
            </h2>
            {team.staff.length === 0 ? (
              <p className="text-sm text-muted-foreground">Staff à venir.</p>
            ) : (
              <ul className="space-y-3">
                {team.staff.map((s) => (
                  <li key={s.id} className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-club/10 text-club">
                      <Shield className="size-5" />
                    </span>
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {s.role}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
