import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarDays, ExternalLink, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { StandingsEditor } from "@/components/standings/standings-editor";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Classement du championnat" };

// Poule officielle FFF du club (A.S. St-Didier St-Just, Départemental 3 — District Haute-Loire).
const FFF_POULE = "https://epreuves.fff.fr/competition/engagement/436524-district-3/phase/1/3";

export default async function ChampionnatPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  const isStaff = ["ADMIN", "DIRIGEANT", "COACH"].includes(session.user.role ?? "");

  const all = await db.standing.findMany({ orderBy: { rank: "asc" } });
  const competition = all[0]?.competition ?? "";
  const rows = all.filter((r) => r.competition === competition);

  return (
    <div className="container max-w-2xl pb-8 pt-8 md:pb-16">
      <PageHeader
        back={{ href: "/dashboard/club", label: "Le club" }}
        eyebrow="Compétition"
        icon={Trophy}
        title="Classement du championnat"
        subtitle={competition || "La table du championnat de l'équipe première."}
      />

      {/* Source officielle FFF — la poule D3 du club (toujours à jour) */}
      <div className="mb-4 rounded-2xl border border-club/30 bg-club/5 p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-club text-white">
            <ExternalLink className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Classement officiel FFF — Départemental 3</p>
            <p className="text-xs text-muted-foreground">District Haute-Loire · données live sur fff.fr</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`${FFF_POULE}/classement`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-club px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-club/90"
          >
            <Trophy className="size-3.5" /> Classement
          </a>
          <a
            href={`${FFF_POULE}/resultats-et-calendrier`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-secondary"
          >
            <CalendarDays className="size-3.5" /> Résultats &amp; calendrier
          </a>
        </div>
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Version club{isStaff ? " — tenue par le staff" : ""}
      </p>
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2.5 font-semibold">#</th>
                <th className="px-3 py-2.5 font-semibold">Équipe</th>
                <th className="px-2 py-2.5 text-center font-semibold">J</th>
                <th className="px-2 py-2.5 text-center font-semibold">G</th>
                <th className="hidden px-2 py-2.5 text-center font-semibold sm:table-cell">N</th>
                <th className="hidden px-2 py-2.5 text-center font-semibold sm:table-cell">P</th>
                <th className="hidden px-2 py-2.5 text-center font-semibold sm:table-cell">Diff</th>
                <th className="px-3 py-2.5 text-center font-semibold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Classement pas encore renseigné.
                    {isStaff ? " Ajoute les équipes ci-dessous." : ""}
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const diff = r.goalsFor - r.goalsAgainst;
                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        "border-b transition-colors last:border-0",
                        r.isOurClub ? "bg-club/10 font-semibold" : "hover:bg-secondary/40",
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-grid size-6 place-items-center rounded-md text-xs font-bold",
                            r.rank <= 2
                              ? "bg-emerald-500/15 text-emerald-500"
                              : r.isOurClub
                                ? "bg-club text-white"
                                : "text-muted-foreground",
                          )}
                        >
                          {r.rank}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn(r.isOurClub && "text-club")}>{r.teamName}</span>
                      </td>
                      <td className="px-2 py-2.5 text-center tabular-nums">{r.played}</td>
                      <td className="px-2 py-2.5 text-center tabular-nums">{r.won}</td>
                      <td className="hidden px-2 py-2.5 text-center tabular-nums sm:table-cell">{r.drawn}</td>
                      <td className="hidden px-2 py-2.5 text-center tabular-nums sm:table-cell">{r.lost}</td>
                      <td className="hidden px-2 py-2.5 text-center tabular-nums sm:table-cell">
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                      <td className="px-3 py-2.5 text-center font-display text-base font-bold">{r.points}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isStaff && <StandingsEditor rows={rows} defaultCompetition={competition} />}
    </div>
  );
}
