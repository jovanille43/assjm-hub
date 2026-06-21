import { describe, it, expect } from "vitest";
import {
  evaluateBadgeRules,
  BADGE_RULES,
  type BadgeFacts,
} from "@/lib/badge-rules";

const baseFacts: BadgeFacts = {
  isPlayer: false,
  goalsTotal: 0,
  assistsTotal: 0,
  maxGoalsInMatch: 0,
  matchesPlayed: 0,
  mvpCount: 0,
  presences: 0,
  isDefensive: false,
  monthVotesReceived: 0,
  likesGiven: 0,
  contributions: 0,
  allStatsAbove80: false,
};
const facts = (over: Partial<BadgeFacts> = {}): BadgeFacts => ({ ...baseFacts, ...over });
const NONE = new Set<string>();

describe("badges – évaluation des règles (pure)", () => {
  it("nouveau_membre est attribué à tout le monde, même non-joueur", () => {
    expect(evaluateBadgeRules(facts(), NONE).toAward).toContain("nouveau_membre");
  });

  it("aucun badge playersOnly pour un non-joueur (ni attribué, ni en objectif)", () => {
    const playersOnly = new Set(BADGE_RULES.filter((r) => r.playersOnly).map((r) => r.key));
    const { toAward, next } = evaluateBadgeRules(facts({ isPlayer: false }), NONE);
    for (const key of [...toAward, ...next.map((n) => n.key)]) {
      expect(playersOnly.has(key)).toBe(false);
    }
  });

  it("un joueur à 5 buts débloque premier_but et buteur", () => {
    const { toAward } = evaluateBadgeRules(facts({ isPlayer: true, goalsTotal: 5 }), NONE);
    expect(toAward).toContain("premier_but");
    expect(toAward).toContain("buteur");
  });

  it("ne réattribue jamais un badge déjà possédé", () => {
    const owned = new Set(["nouveau_membre"]);
    expect(evaluateBadgeRules(facts(), owned).toAward).not.toContain("nouveau_membre");
  });

  it("un objectif partiel apparaît dans next avec sa progression", () => {
    const { next, toAward } = evaluateBadgeRules(facts({ isPlayer: true, presences: 2 }), NONE);
    expect(toAward).not.toContain("present"); // 2/3
    expect(next.find((n) => n.key === "present")).toEqual({ key: "present", current: 2, target: 3 });
  });

  it("la progression d'un objectif est plafonnée à la cible", () => {
    // 4 présences : present(3) atteint → toAward ; lion(10) en cours, plafonné à 4/10.
    const { next, toAward } = evaluateBadgeRules(facts({ isPlayer: true, presences: 4 }), NONE);
    expect(toAward).toContain("present");
    expect(next.find((n) => n.key === "lion")?.current).toBe(4);
  });

  it("next est trié du plus proche au plus lointain (ratio décroissant)", () => {
    const { next } = evaluateBadgeRules(
      facts({ isPlayer: true, goalsTotal: 4, assistsTotal: 1, presences: 2 }),
      NONE,
    );
    expect(next[0].key).toBe("buteur"); // 4/5 = l'objectif le plus proche
    const ratios = next.map((n) => n.current / n.target);
    expect(ratios).toEqual([...ratios].sort((a, b) => b - a));
  });

  it("le_mur ne compte que pour les profils défensifs", () => {
    const attacker = evaluateBadgeRules(facts({ isPlayer: true, matchesPlayed: 5 }), NONE);
    expect(attacker.toAward).not.toContain("le_mur");
    const defender = evaluateBadgeRules(facts({ isPlayer: true, isDefensive: true, matchesPlayed: 5 }), NONE);
    expect(defender.toAward).toContain("le_mur");
  });

  it("all_star exige les 6 stats ≥ 80", () => {
    expect(evaluateBadgeRules(facts({ isPlayer: true, allStatsAbove80: true }), NONE).toAward).toContain("all_star");
    expect(evaluateBadgeRules(facts({ isPlayer: true, allStatsAbove80: false }), NONE).toAward).not.toContain("all_star");
  });

  it("toutes les clés de règle sont uniques", () => {
    const keys = BADGE_RULES.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
