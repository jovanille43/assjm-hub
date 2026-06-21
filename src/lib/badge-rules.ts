/* ────────────────────────────────────────────────────────────────────────────
   Cœur PUR du moteur de badges — aucune E/S (ni base, ni notifications).
   Isolé ici pour être testable unitairement et garanti sans effet de bord.
   Les badges récompensent de vraies prestations (buts, passes, présences, MVP,
   vie du club), jamais un tirage de pack. Chaque règle expose une progression
   (current / target) pour afficher « Buteur — 3/5 buts » sur le tableau de bord.
   ──────────────────────────────────────────────────────────────────────────── */

export type BadgeFacts = {
  isPlayer: boolean;
  goalsTotal: number;
  assistsTotal: number;
  maxGoalsInMatch: number;
  matchesPlayed: number;
  mvpCount: number;
  presences: number; // convocations acceptées
  isDefensive: boolean; // GK ou DEF
  monthVotesReceived: number; // votes « Joueur du mois » reçus
  likesGiven: number;
  contributions: number; // posts + commentaires + messages
  allStatsAbove80: boolean;
};

type BadgeRule = {
  key: string;
  target: number;
  current: (f: BadgeFacts) => number;
  playersOnly?: boolean;
};

// La description affichée vient de la table Badge (seed) — ici, la mécanique.
export const BADGE_RULES: BadgeRule[] = [
  { key: "nouveau_membre", target: 1, current: () => 1 },
  { key: "ame_vestiaire", target: 10, current: (f) => f.contributions },
  { key: "fan_fidele", target: 10, current: (f) => f.likesGiven },
  { key: "premier_but", target: 1, current: (f) => f.goalsTotal, playersOnly: true },
  { key: "buteur", target: 5, current: (f) => f.goalsTotal, playersOnly: true },
  { key: "passeur", target: 5, current: (f) => f.assistsTotal, playersOnly: true },
  { key: "present", target: 3, current: (f) => f.presences, playersOnly: true },
  { key: "en_feu", target: 2, current: (f) => f.maxGoalsInMatch, playersOnly: true },
  { key: "le_mur", target: 3, current: (f) => (f.isDefensive ? f.matchesPlayed : 0), playersOnly: true },
  { key: "capitaine", target: 1, current: (f) => f.mvpCount, playersOnly: true },
  { key: "joueur_mois", target: 3, current: (f) => f.monthVotesReceived, playersOnly: true },
  { key: "lion", target: 10, current: (f) => f.presences, playersOnly: true },
  { key: "hat_trick", target: 3, current: (f) => f.maxGoalsInMatch, playersOnly: true },
  { key: "all_star", target: 1, current: (f) => (f.allStatsAbove80 ? 1 : 0), playersOnly: true },
  { key: "legende_club", target: 100, current: (f) => f.matchesPlayed, playersOnly: true },
];

// Points offerts quand un badge est débloqué (selon la rareté de la table Badge).
export const BADGE_POINTS: Record<string, number> = {
  COMMON: 15,
  RARE: 35,
  EPIC: 70,
  LEGENDARY: 150,
};

export type BadgeProgressEntry = { key: string; current: number; target: number };

/**
 * Évalue toutes les règles à partir des faits et des badges déjà possédés
 * (par clé). Retourne les badges à attribuer et les prochains objectifs
 * (progression plafonnée, triés du plus proche au plus lointain).
 * Fonction PURE : mêmes entrées → mêmes sorties, aucun effet de bord.
 */
export function evaluateBadgeRules(
  facts: BadgeFacts,
  ownedKeys: Set<string>,
): { toAward: string[]; next: BadgeProgressEntry[] } {
  const toAward: string[] = [];
  const next: BadgeProgressEntry[] = [];

  for (const rule of BADGE_RULES) {
    if (rule.playersOnly && !facts.isPlayer) continue;
    if (ownedKeys.has(rule.key)) continue;
    const current = Math.min(rule.current(facts), rule.target);
    if (current >= rule.target) toAward.push(rule.key);
    else next.push({ key: rule.key, current, target: rule.target });
  }

  // Objectifs les plus proches d'être atteints en premier.
  next.sort((a, b) => b.current / b.target - a.current / a.target);
  return { toAward, next };
}
