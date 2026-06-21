import type { Metadata } from "next";
import { CalendarCheck, Flame, Goal, ShieldAlert, Target } from "lucide-react";
import { Leaderboard } from "@/components/stats/leaderboard";
import {
  getClubForm,
  getTopAssists,
  getTopAttendance,
  getTopFairplay,
  getTopScorers,
} from "@/lib/stats";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Statistiques",
  description: "Buteurs, passeurs, présences et forme de l'AS Saint-Just-Malmont.",
};

const RESULT_STYLE: Record<string, { label: string; cls: string }> = {
  W: { label: "V", cls: "bg-emerald-500" },
  D: { label: "N", cls: "bg-zinc-400" },
  L: { label: "D", cls: "bg-club" },
};

export default async function StatsPage() {
  const [scorers, assists, attendance, form, fairplay] = await Promise.all([
    getTopScorers(8),
    getTopAssists(8),
    getTopAttendance(8),
    getClubForm(5),
    getTopFairplay(10),
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
            Stats du club
          </span>
          <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">
            Les <span className="text-club">statistiques</span>
          </h1>
          <p className="mt-3 max-w-xl text-blue-100/70">
            Buteurs, passeurs, présences et forme du moment — la saison en chiffres.
          </p>

          {/* Forme du moment */}
          {form.length > 0 && (
            <div className="mt-6 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-sm text-blue-100/70">
                <Flame className="size-4 text-club" /> Forme
              </span>
              <div className="flex gap-1.5">
                {form.map((m) => {
                  const s = m.result ? RESULT_STYLE[m.result] : null;
                  return (
                    <span
                      key={m.id}
                      title={`vs ${m.opponent} (${m.scoreFor}-${m.scoreAgainst})`}
                      className={cn(
                        "grid size-8 place-items-center rounded-lg font-display text-sm font-bold text-white",
                        s?.cls ?? "bg-white/20",
                      )}
                    >
                      {s?.label ?? "-"}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="container grid gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
        <Leaderboard
          title="Buteurs"
          icon={<Goal className="size-5" />}
          unit="buts"
          items={scorers}
          accent="#E11D2A"
        />
        <Leaderboard
          title="Passeurs"
          icon={<Target className="size-5" />}
          unit="passes"
          items={assists}
          accent="#3b82f6"
        />
        <Leaderboard
          title="Présences"
          icon={<CalendarCheck className="size-5" />}
          unit="matchs"
          items={attendance}
          accent="#22c55e"
        />
        {fairplay.length > 0 && (
          <div className="rounded-2xl border bg-card p-5 md:col-span-2 lg:col-span-3">
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="size-5 text-amber-500" />
              <h2 className="font-display text-lg font-bold">Fair-play — Cartons</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {fairplay.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border bg-secondary/30 px-3 py-2.5 text-sm">
                  <span className="w-5 text-center text-xs font-bold text-muted-foreground">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-medium capitalize">
                    {p.firstName} {p.lastName}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs">
                    {p.yellow > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-bold" style={{ background: "#fbbf24", color: "#000" }}>
                        🟨 {p.yellow}
                      </span>
                    )}
                    {p.red > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-club px-1.5 py-0.5 font-bold text-white">
                        🟥 {p.red}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
