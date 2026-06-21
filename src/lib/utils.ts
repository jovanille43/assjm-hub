import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fusionne des classes Tailwind sans conflit. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Initiales d'un nom (ex: "Léo Martin" -> "LM"). */
export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Slugify simple, sans accents. */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Note FUT globale à partir des 6 stats. */
export function overall(stats: {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}) {
  const { pace, shooting, passing, dribbling, defending, physical } = stats;
  return Math.round(
    (pace + shooting + passing + dribbling + defending + physical) / 6,
  );
}

/** Formate un nombre de façon compacte (1 200 -> 1,2k). */
export function compact(n: number) {
  return new Intl.NumberFormat("fr-FR", { notation: "compact" }).format(n);
}
