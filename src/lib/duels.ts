/**
 * Logique du duel de pénaltys (PvP asynchrone).
 *
 * But découpé en 6 zones :
 *    0 1 2   (haut gauche / centre / droite)
 *    3 4 5   (bas  gauche / centre / droite)
 *
 * Chaque joueur soumet 5 TIRS (où il frappe) et 5 PLONGEONS (où il se jette
 * comme gardien). On confronte les tirs de l'un aux plongeons de l'autre.
 * Les stats de la carte FUT départagent les face-à-face : un gros TIR passe
 * parfois malgré un bon plongeon, et un bon gardien sort parfois un tir non lu.
 */

export const ZONE_COUNT = 6;
export const SHOTS_PER_DUEL = 5;

export const ZONE_LABELS = [
  "Lucarne gauche",
  "Haut centre",
  "Lucarne droite",
  "Bas gauche",
  "Ras de terre",
  "Bas droite",
] as const;

// Bonus de stats par niveau d'amélioration (dupliqué volontairement de
// player-card pour garder ce module isomorphe et léger côté client).
const UPGRADE_BONUS = [0, 3, 6, 10] as const;

export type CardStats = {
  shooting: number;
  pace: number;
  defending: number;
  physical: number;
  position: string;
  upgradeLevel: number;
};

export const DEFAULT_CARD: CardStats = {
  shooting: 68,
  pace: 68,
  defending: 64,
  physical: 66,
  position: "MID",
  upgradeLevel: 0,
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Réflexes du gardien dérivés de la carte (un vrai GK est nettement meilleur). */
export function keeperReflex(s: CardStats): number {
  const bonus = UPGRADE_BONUS[s.upgradeLevel] ?? 0;
  const base = (s.pace + bonus) * 0.5 + (s.defending + bonus) * 0.35 + (s.physical + bonus) * 0.15;
  return s.position === "GK" ? base + 12 : base;
}

export function shooterPower(s: CardStats): number {
  return (s.shooting ?? 70) + (UPGRADE_BONUS[s.upgradeLevel] ?? 0);
}

/** Résout un pénalty. `rng` injectable pour les tests. true = BUT. */
export function resolvePenalty(
  shotZone: number,
  diveZone: number,
  shooter: CardStats,
  keeper: CardStats,
  rng: () => number = Math.random,
): boolean {
  if (shotZone === diveZone) {
    // Gardien a lu le tir : le but ne rentre que si la frappe est assez puissante.
    const scoreProb = clamp(shooterPower(shooter) / 280, 0.05, 0.45);
    return rng() < scoreProb;
  }
  // Mauvais côté : but, sauf réflexe exceptionnel du gardien.
  const saveProb = clamp(keeperReflex(keeper) / 620, 0.02, 0.18);
  return rng() >= saveProb;
}

/** Nombre de buts d'un tireur (5 tirs) face aux plongeons adverses. */
export function scoreShootout(
  shots: number[],
  dives: number[],
  shooter: CardStats,
  keeper: CardStats,
  rng: () => number = Math.random,
): boolean[] {
  return shots.map((shot, i) =>
    resolvePenalty(shot, dives[i] ?? -1, shooter, keeper, rng),
  );
}

export function serializeZones(zones: number[]): string {
  return zones.join(",");
}

export function parseZones(s: string | null | undefined): number[] {
  if (!s) return [];
  return s.split(",").map((n) => parseInt(n, 10)).filter((n) => !Number.isNaN(n));
}

export function isValidPlay(zones: number[]): boolean {
  return (
    Array.isArray(zones) &&
    zones.length === SHOTS_PER_DUEL &&
    zones.every((z) => Number.isInteger(z) && z >= 0 && z < ZONE_COUNT)
  );
}
