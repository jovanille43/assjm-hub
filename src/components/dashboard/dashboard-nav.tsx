"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Gamepad2,
  LayoutDashboard,
  MessageCircle,
  Shield,
  ShieldHalf,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Routes regroupées sous chaque hub (pour le surlignage de l'onglet actif).
// « Le club » est la porte d'entrée unique : tout y est rangé (cf. /dashboard/club).
const CLUB_EXTRA = [
  "/dashboard/convocations",
  "/dashboard/votes",
  "/dashboard/apres-match",
  "/dashboard/match-center",
  "/dashboard/championnat",
  "/dashboard/classement",
  "/dashboard/annonces",
  "/dashboard/blessures",
  "/dashboard/entrainements",
  "/dashboard/saison",
  "/dashboard/calendrier",
  "/dashboard/club/palmares",
  "/calendrier",
  "/stats",
  "/equipes",
];
const JEUX_EXTRA = ["/dashboard/duels", "/dashboard/pronos", "/dashboard/packs", "/dashboard/quiz"];

// Grandes sections uniquement — chaque hub contient le reste.
const LINKS: { href: string; label: string; icon: typeof LayoutDashboard; extra?: string[] }[] = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/dashboard/club", label: "Le club", icon: ShieldHalf, extra: CLUB_EXTRA },
  { href: "/dashboard/jeux", label: "Jeux", icon: Gamepad2, extra: JEUX_EXTRA },
  { href: "/dashboard/social", label: "Communauté", icon: MessageCircle, extra: ["/dashboard/messages"] },
  { href: "/dashboard/profil", label: "Mon profil", icon: UserCog },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { data } = useSession();
  const role = data?.user?.role ?? "";

  let links = [...LINKS];
  if (role === "ADMIN") {
    links = [...links, { href: "/dashboard/admin", label: "Admin", icon: Shield }];
  }
  return (
    <nav className="sticky top-16 z-30 hidden border-b border-border/70 bg-background/85 backdrop-blur-xl md:top-20 md:block">
      <div className="container flex gap-1 overflow-x-auto py-2">
        {links.map((l) => {
          const active =
            pathname === l.href ||
            (l.href !== "/dashboard" && pathname.startsWith(l.href + "/")) ||
            (l.extra?.some((e) => pathname === e || pathname.startsWith(e + "/")) ?? false);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
                active ? "bg-club text-white" : "text-foreground/80 hover:bg-secondary",
              )}
            >
              <l.icon className="size-4" />
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
