import { Crest } from "@/components/brand/crest";
import { POSITIONS } from "@/lib/enums";
import { cn, initials, overall as calcOverall } from "@/lib/utils";

export type PlayerCardData = {
  firstName: string;
  lastName: string;
  number: number | null;
  position: string;
  photo?: string | null;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  upgradeLevel?: number;
  team?: { name: string } | null;
};

// Bonus d'OVR par palier (6 niveaux : 0→5)
export const UPGRADE_BONUS = [0, 2, 4, 7, 11, 16] as const;

// Coût pour atteindre chaque palier (en points). Index = niveau cible.
export const UPGRADE_COSTS = [0, 150, 400, 900, 2000, 4500] as const;

export const UPGRADE_LABELS = ["COMMON", "BRONZE", "ARGENT", "OR", "ÉPIQUE", "LÉGENDAIRE"] as const;

export function applyUpgrade(player: PlayerCardData) {
  const bonus = UPGRADE_BONUS[player.upgradeLevel ?? 0] ?? 0;
  return {
    pace: Math.min(99, player.pace + bonus),
    shooting: Math.min(99, player.shooting + bonus),
    passing: Math.min(99, player.passing + bonus),
    dribbling: Math.min(99, player.dribbling + bonus),
    defending: Math.min(99, player.defending + bonus),
    physical: Math.min(99, player.physical + bonus),
  };
}

export function PlayerCard({
  player,
  className,
}: {
  player: PlayerCardData;
  className?: string;
}) {
  const upgradeLevel = player.upgradeLevel ?? 0;
  const upgraded = applyUpgrade(player);
  const ovr = calcOverall(upgraded);
  const pos = POSITIONS[player.position as keyof typeof POSITIONS] ?? POSITIONS.MID;
  const stats = [
    { k: "RAP", v: upgraded.pace },
    { k: "DRI", v: upgraded.dribbling },
    { k: "TIR", v: upgraded.shooting },
    { k: "DEF", v: upgraded.defending },
    { k: "PAS", v: upgraded.passing },
    { k: "PHY", v: upgraded.physical },
  ];

  return (
    <div className={cn("group w-64 [perspective:1200px]", className)}>
      <div className="fut-frame relative rounded-[1.8rem] p-[3px] transition-transform duration-300 ease-out will-change-transform group-hover:[transform:rotateX(5deg)_rotateY(-7deg)_translateY(-6px)_scale(1.03)]">
        <div className="relative flex aspect-[63/88] flex-col overflow-hidden rounded-[1.55rem] bg-gradient-to-b from-navy-800 to-navy-950 p-5 text-white">
          <div className="absolute inset-0 bg-grid opacity-40" />
          <div className="pointer-events-none absolute inset-0 fut-holo" />
          <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-club/20 blur-2xl" />

        {/* Badge niveau amélioration */}
        {upgradeLevel > 0 && (
          <div className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
            style={{
              background:
                upgradeLevel === 5 ? "#f59e0b33" :
                upgradeLevel === 4 ? "#a855f733" :
                upgradeLevel === 3 ? "#fbbf2433" :
                upgradeLevel === 2 ? "#94a3b833" :
                "#92400e33",
              color:
                upgradeLevel === 5 ? "#fcd34d" :
                upgradeLevel === 4 ? "#c084fc" :
                upgradeLevel === 3 ? "#fbbf24" :
                upgradeLevel === 2 ? "#cbd5e1" :
                "#b45309",
              border: "1px solid currentColor",
            }}
          >
            {UPGRADE_LABELS[upgradeLevel]}
          </div>
        )}

        {/* En-tête : note + poste + blason */}
        <div className="relative flex items-start justify-between">
          <div className="text-center leading-none">
            <div className="font-display text-5xl font-extrabold">{ovr}</div>
            <div className="mt-1 text-xs font-bold tracking-[0.2em] text-club">
              {pos.short}
            </div>
            <div className="mx-auto mt-2 h-px w-8 bg-white/30" />
            {player.number != null && (
              <div className="mt-1 text-[11px] text-white/60">#{player.number}</div>
            )}
          </div>
          <Crest className="h-12 w-auto drop-shadow" />
        </div>

        {/* Photo / monogramme central — flexible : absorbe l'espace restant
            (min-h-0 + h-full plafonné) pour que les 6 stats tiennent toujours. */}
        <div className="relative my-2 grid min-h-0 flex-1 place-items-center">
          {player.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={player.photo}
              alt={`${player.firstName} ${player.lastName}`}
              className="aspect-square h-full max-h-24 min-h-14 w-auto rounded-full object-cover ring-2 ring-white/30"
            />
          ) : (
            <div className="grid aspect-square h-full max-h-24 min-h-14 w-auto place-items-center rounded-full bg-gradient-to-br from-white/20 to-white/5 font-display text-3xl font-extrabold ring-2 ring-white/20">
              {initials(`${player.firstName} ${player.lastName}`)}
            </div>
          )}
          {upgradeLevel === 5 && (
            <div className="pointer-events-none absolute inset-0 rounded-full bg-amber-400/10 blur-md" />
          )}
        </div>

        {/* Nom */}
        <div className="relative text-center">
          <div className="truncate font-display text-xl font-bold uppercase tracking-wide">
            {player.lastName}
          </div>
          <div className="truncate text-[11px] text-white/50">
            {player.firstName}
            {player.team ? ` · ${player.team.name}` : ""}
          </div>
        </div>

        {/* Stats */}
        <div className="relative mt-3 grid grid-cols-2 gap-x-5 gap-y-1.5 border-t border-white/10 pt-3 text-sm">
          {stats.map((s) => (
            <div key={s.k} className="flex items-center justify-between tabular-nums">
              <span className="font-display font-bold">{s.v}</span>
              <span className="text-xs font-medium text-white/50">{s.k}</span>
            </div>
          ))}
        </div>

        {/* Brillance qui balaie la carte (au-dessus du contenu) */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-3/5 fut-shine" />
        </div>
      </div>
    </div>
  );
}
