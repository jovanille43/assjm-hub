/** Logique de score des pronostics. */

export const EXACT_POINTS = 50; // score exact
export const OUTCOME_POINTS = 15; // bon résultat (V/N/D) mais score différent

export type Outcome = "W" | "D" | "L";

export function outcomeOf(forGoals: number, againstGoals: number): Outcome {
  if (forGoals > againstGoals) return "W";
  if (forGoals < againstGoals) return "L";
  return "D";
}

/** Points bruts d'un pronostic (avant boost ×2). */
export function scorePrediction(
  predFor: number,
  predAgainst: number,
  realFor: number,
  realAgainst: number,
): number {
  if (predFor === realFor && predAgainst === realAgainst) return EXACT_POINTS;
  if (outcomeOf(predFor, predAgainst) === outcomeOf(realFor, realAgainst)) return OUTCOME_POINTS;
  return 0;
}
