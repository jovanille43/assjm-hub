import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* En-tête de page unifié du tableau de bord : surtitre (eyebrow) + titre (icône
   optionnelle) + sous-titre, avec lien retour et action optionnels. Garantit le
   même rythme visuel partout — à utiliser sur toutes les pages /dashboard. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  back,
  action,
  className,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  back?: { href: string; label: string };
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <header className={cn("mb-6", className)}>
      {back ? (
        <Link
          href={back.href}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {back.label}
        </Link>
      ) : null}
      <div className={cn(action && "flex items-end justify-between gap-3")}>
        <div>
          {eyebrow ? (
            <span className="eyebrow">
              <span className="h-px w-6 bg-club" />
              {eyebrow}
            </span>
          ) : null}
          <h1 className="mt-2 flex items-center gap-2 font-display text-3xl font-extrabold sm:text-4xl">
            {Icon ? <Icon className="size-7 shrink-0 text-club" /> : null}
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </header>
  );
}
