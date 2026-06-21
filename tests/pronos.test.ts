import { describe, it, expect } from "vitest";
import { scorePrediction, outcomeOf, EXACT_POINTS, OUTCOME_POINTS } from "@/lib/pronos";

describe("pronos – scoring", () => {
  it("score exact = points max", () => {
    expect(scorePrediction(2, 1, 2, 1)).toBe(EXACT_POINTS);
    expect(scorePrediction(0, 0, 0, 0)).toBe(EXACT_POINTS);
  });

  it("bon résultat mais score différent = points partiels", () => {
    expect(scorePrediction(3, 1, 2, 0)).toBe(OUTCOME_POINTS); // victoire prédite, victoire réelle
    expect(scorePrediction(1, 1, 2, 2)).toBe(OUTCOME_POINTS); // nul prédit, nul réel
    expect(scorePrediction(0, 1, 0, 3)).toBe(OUTCOME_POINTS); // défaite prédite, défaite réelle
  });

  it("mauvais résultat = 0", () => {
    expect(scorePrediction(2, 0, 0, 2)).toBe(0);
    expect(scorePrediction(1, 1, 2, 0)).toBe(0);
  });

  it("outcomeOf", () => {
    expect(outcomeOf(2, 1)).toBe("W");
    expect(outcomeOf(1, 1)).toBe("D");
    expect(outcomeOf(0, 2)).toBe("L");
  });
});
