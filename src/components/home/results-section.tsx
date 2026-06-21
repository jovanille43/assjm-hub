import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Home, Plane, Goal } from "lucide-react";
import { SectionHeading } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { resultOf } from "@/lib/enums";
import { initials } from "@/lib/utils";

type Result = {
  id: string;
  opponent: string;
  date: Date;
  venue: string;
  scoreFor: number | null;
  scoreAgainst: number | null;
  competition: string | null;
  team: { name: string };
};

type Scorer = {
  player: { id: string; firstName: string; lastName: string; team: { name: string } | null };
  goals: number;
};

const RESULT_STYLE: Record<string, { label: string; cls: string }> = {
  W: { label: "V", cls: "bg-emerald-500" },
  D: { label: "N", cls: "bg-zinc-400" },
  L: { label: "D", cls: "bg-club" },
};

const PODIUM = ["text-amber-400", "text-zinc-300", "text-amber-700"];

export function ResultsSection({
  results,
  scorers,
}: {
  results: Result[];
  scorers: Scorer[];
}) {
  return (
    <section id="resultats" className="section scroll-mt-24 bg-secondary/40">
      <SectionHeading
        eyebrow="Résultats"
        title={
          <>
            Derniers <span className="text-gradient">résultats</span>
          </>
        }
        description="Les performances récentes de nos équipes."
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Résultats récents */}
        <Reveal className="space-y-3">
          {results.length === 0 && (
            <p className="text-muted-foreground">Aucun résultat enregistré.</p>
          )}
          {results.map((m) => {
            const r = resultOf(m.scoreFor, m.scoreAgainst);
            const style = r ? RESULT_STYLE[r] : null;
            return (
              <div
                key={m.id}
                className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-club/40"
              >
                <div
                  className={`grid size-10 shrink-0 place-items-center rounded-xl font-display text-lg font-bold text-white ${style?.cls ?? "bg-muted"}`}
                >
                  {style?.label ?? "-"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <span>ASSJM</span>
                    <span className="font-display text-lg tabular-nums">
                      {m.scoreFor} – {m.scoreAgainst}
                    </span>
                    <span className="truncate">{m.opponent}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    {m.venue === "HOME" ? (
                      <Home className="size-3" />
                    ) : (
                      <Plane className="size-3" />
                    )}
                    <span>{m.team.name}</span>
                    <span>·</span>
                    <span>{format(new Date(m.date), "d MMM yyyy", { locale: fr })}</span>
                  </div>
                </div>
                {m.competition && (
                  <span className="hidden shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground sm:block">
                    {m.competition}
                  </span>
                )}
              </div>
            );
          })}
        </Reveal>

        {/* Top buteurs */}
        <Reveal>
          <div className="rounded-2xl border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Goal className="size-5 text-club" />
              <h3 className="font-display text-xl font-bold">Top buteurs</h3>
            </div>
            <div className="space-y-3">
              {scorers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Les statistiques arrivent bientôt.
                </p>
              )}
              {scorers.map((s, i) => (
                <div key={s.player.id} className="flex items-center gap-3">
                  <span
                    className={`w-5 text-center font-display text-lg font-bold ${PODIUM[i] ?? "text-muted-foreground"}`}
                  >
                    {i + 1}
                  </span>
                  <div className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-navy-600 to-navy-900 text-sm font-bold text-white">
                    {initials(`${s.player.firstName} ${s.player.lastName}`)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {s.player.firstName} {s.player.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.player.team?.name ?? "—"}
                    </p>
                  </div>
                  <span className="font-display text-xl font-bold text-club">
                    {s.goals}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
