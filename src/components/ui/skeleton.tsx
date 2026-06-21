import { cn } from "@/lib/utils";

/** Bloc de chargement animé (placeholder de contenu). */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-muted/60", className)}
      {...props}
    />
  );
}

export { Skeleton };
