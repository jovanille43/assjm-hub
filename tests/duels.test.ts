import { describe, it, expect } from "vitest";
import {
  resolvePenalty,
  scoreShootout,
  isValidPlay,
  parseZones,
  serializeZones,
  DEFAULT_CARD,
} from "@/lib/duels";

const shooter = DEFAULT_CARD;
const keeper = DEFAULT_CARD;

describe("duels – résolution penalty", () => {
  it("même zone : but si frappe puissante (rng bas), sinon arrêt", () => {
    expect(resolvePenalty(2, 2, shooter, keeper, () => 0)).toBe(true);
    expect(resolvePenalty(2, 2, shooter, keeper, () => 0.99)).toBe(false);
  });

  it("mauvaise zone : but sauf réflexe (rng très bas)", () => {
    expect(resolvePenalty(0, 5, shooter, keeper, () => 0.99)).toBe(true);
    expect(resolvePenalty(0, 5, shooter, keeper, () => 0)).toBe(false);
  });

  it("scoreShootout renvoie un résultat par tir", () => {
    const res = scoreShootout([0, 1, 2, 3, 4], [5, 5, 5, 5, 5], shooter, keeper, () => 0.99);
    expect(res).toHaveLength(5);
    expect(res.every((g) => g === true)).toBe(true); // toutes mauvaises zones + rng haut = buts
  });
});

describe("duels – validation & sérialisation", () => {
  it("isValidPlay", () => {
    expect(isValidPlay([0, 1, 2, 3, 4])).toBe(true);
    expect(isValidPlay([0, 1, 2])).toBe(false);
    expect(isValidPlay([0, 1, 2, 3, 9])).toBe(false);
  });

  it("parse/serialize roundtrip", () => {
    expect(parseZones(serializeZones([0, 3, 5, 1, 4]))).toEqual([0, 3, 5, 1, 4]);
    expect(parseZones("")).toEqual([]);
    expect(parseZones(null)).toEqual([]);
  });
});
