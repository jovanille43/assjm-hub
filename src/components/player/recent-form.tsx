import { cn } from "@/lib/utils";

type Result = "W" | "D" | "L";

const STYLE: Record<Result, { label: string; cls: string; title: string }> = {
  W: { label: "V", cls: "bg-emerald-500 text-white", title: "Victoire" },
  D: { label: "N", cls: "bg-zinc-400 text-white", title: "Match nul" },
  L: { label: "D", cls: "bg-club text-white", title: "Défaite" },
};

function resultOf(scoreFor: number | null, scoreAgainst: number | null): Result | null {
  if (scoreFor == null || scoreAgainst == null) return null;
  if (scoreFor > scoreAgainst) return "W";
  if (scoreFor === scoreAgainst) return "D";
  return "L";
}

export function RecentForm({
  matches,
}: {
  matches: { scoreFor: number | null; scoreAgainst: number | null; opponent: string }[];
}) {
  if (matches.length === 0) return null;

  const results = matches.map((m) => ({ r: resultOf(m.scoreFor, m.scoreAgainst), opponent: m.opponent, scoreFor: m.scoreFor, scoreAgainst: m.scoreAgainst }));

  return (
    <div className="flex items-center gap-1.5">
      {results.map((m, i) => {
        const s = m.r ? STYLE[m.r] : null;
        return (
          <span
            key={i}
            title={s ? `${s.title} vs ${m.opponent} (${m.scoreFor}-${m.scoreAgainst})` : `vs ${m.opponent}`}
            className={cn(
              "grid size-7 place-items-center rounded-md font-display text-xs font-bold",
              s?.cls ?? "bg-secondary text-muted-foreground",
            )}
          >
            {s?.label ?? "-"}
          </span>
        );
      })}
    </div>
  );
}
