import { SectionHeading } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  rank: number;
  isOurClub: boolean;
  competition: string;
};

export function StandingsSection({ standings }: { standings: Row[] }) {
  const competition = standings[0]?.competition;

  return (
    <section id="classement" className="section scroll-mt-24">
      <SectionHeading
        eyebrow="Classement"
        title={
          <>
            Le <span className="text-gradient">classement</span>
          </>
        }
        description={competition ?? "Le classement du championnat."}
      />

      <Reveal className="mt-10 overflow-hidden rounded-2xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Équipe</th>
                <th className="px-3 py-3 text-center font-semibold">J</th>
                <th className="px-3 py-3 text-center font-semibold">G</th>
                <th className="hidden px-3 py-3 text-center font-semibold sm:table-cell">N</th>
                <th className="hidden px-3 py-3 text-center font-semibold sm:table-cell">P</th>
                <th className="hidden px-3 py-3 text-center font-semibold md:table-cell">Diff</th>
                <th className="px-4 py-3 text-center font-semibold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Classement bientôt disponible.
                  </td>
                </tr>
              )}
              {standings.map((row) => {
                const diff = row.goalsFor - row.goalsAgainst;
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b transition-colors last:border-0",
                      row.isOurClub
                        ? "bg-club/10 font-semibold"
                        : "hover:bg-secondary/50",
                    )}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-grid size-6 place-items-center rounded-md text-xs font-bold",
                          row.rank <= 2
                            ? "bg-emerald-500/15 text-emerald-500"
                            : row.isOurClub
                              ? "bg-club text-white"
                              : "text-muted-foreground",
                        )}
                      >
                        {row.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(row.isOurClub && "text-club")}>
                        {row.teamName}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums">{row.played}</td>
                    <td className="px-3 py-3 text-center tabular-nums">{row.won}</td>
                    <td className="hidden px-3 py-3 text-center tabular-nums sm:table-cell">{row.drawn}</td>
                    <td className="hidden px-3 py-3 text-center tabular-nums sm:table-cell">{row.lost}</td>
                    <td className="hidden px-3 py-3 text-center tabular-nums md:table-cell">
                      {diff > 0 ? `+${diff}` : diff}
                    </td>
                    <td className="px-4 py-3 text-center font-display text-base font-bold">
                      {row.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Reveal>
    </section>
  );
}
