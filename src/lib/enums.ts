/**
 * SQLite ne supportant pas les enums Prisma, on centralise ici les valeurs
 * autorisées + leurs libellés FR et helpers d'affichage.
 */

export const ROLES = {
  ADMIN: "Administrateur",
  DIRIGEANT: "Dirigeant",
  COACH: "Coach",
  JOUEUR: "Joueur",
  SUPPORTER: "Supporter",
} as const;
export type Role = keyof typeof ROLES;

export const POSITIONS = {
  GK: { label: "Gardien", short: "GAR", color: "#f59e0b" },
  DEF: { label: "Défenseur", short: "DEF", color: "#3b82f6" },
  MID: { label: "Milieu", short: "MIL", color: "#22c55e" },
  FWD: { label: "Attaquant", short: "ATT", color: "#ef4444" },
} as const;
export type Position = keyof typeof POSITIONS;

export const CATEGORIES: Record<string, string> = {
  U7: "U7",
  U9: "U9",
  U11: "U11",
  U13: "U13",
  U15: "U15",
  U18: "U18",
  SENIOR_A: "Séniors A",
  SENIOR_B: "Séniors B",
  VETERAN: "Vétérans",
  FEMININE: "Féminines",
};

export const MATCH_STATUS: Record<string, string> = {
  SCHEDULED: "À venir",
  LIVE: "En direct",
  FINISHED: "Terminé",
  POSTPONED: "Reporté",
  CANCELLED: "Annulé",
};

export const EVENT_TYPES: Record<string, { label: string; icon: string }> = {
  TRAINING: { label: "Entraînement", icon: "Dumbbell" },
  MATCH: { label: "Match", icon: "Trophy" },
  TOURNAMENT: { label: "Tournoi", icon: "Award" },
  MEETING: { label: "Réunion", icon: "Users" },
  EVENT: { label: "Événement", icon: "PartyPopper" },
};

export const RARITY: Record<
  string,
  { label: string; from: string; to: string }
> = {
  COMMON: { label: "Commun", from: "#94a3b8", to: "#cbd5e1" },
  RARE: { label: "Rare", from: "#3b82f6", to: "#60a5fa" },
  EPIC: { label: "Épique", from: "#a855f7", to: "#c084fc" },
  LEGENDARY: { label: "Légendaire", from: "#f59e0b", to: "#fcd34d" },
};

export function resultOf(scoreFor?: number | null, scoreAgainst?: number | null) {
  if (scoreFor == null || scoreAgainst == null) return null;
  if (scoreFor > scoreAgainst) return "W" as const;
  if (scoreFor < scoreAgainst) return "L" as const;
  return "D" as const;
}
