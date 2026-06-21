import { cn } from "@/lib/utils";

/**
 * Blason officiel de l'AS Saint-Just-Malmont (logo fourni par le club, fond
 * détouré en PNG transparent via scripts/process-logo.mjs).
 * Conserve l'API précédente (`className`, `animated`) pour rester compatible
 * avec tous les emplacements existants. `animated` ajoute un léger flottement.
 */
export function Crest({
  className,
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-assjm.png"
      alt="Blason de l'AS Saint-Just-Malmont"
      draggable={false}
      className={cn(
        "select-none object-contain",
        animated && "motion-safe:animate-float",
        className,
      )}
    />
  );
}
