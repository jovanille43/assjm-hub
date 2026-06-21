"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MessagesSquare,
  Menu,
  Shield,
  ShieldHalf,
  UserCog,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mêmes regroupements que la nav desktop (cohérence).
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

const TABS: { href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; extra?: string[] }[] = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/club", label: "Club", icon: ShieldHalf, extra: CLUB_EXTRA },
  { href: "/dashboard/jeux", label: "Jeux", icon: Gamepad2, extra: JEUX_EXTRA },
  { href: "/dashboard/social", label: "Social", icon: MessageCircle, extra: ["/dashboard/messages"] },
  { href: "/dashboard/profil", label: "Profil", icon: UserCog },
];

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function useInstallPrompt() {
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);

  React.useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = React.useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }, [deferred]);

  return { canInstall: !!deferred, install };
}

export function MobileTabBar() {
  const pathname = usePathname();
  const { data } = useSession();
  const role = data?.user?.role ?? "";
  const [moreOpen, setMoreOpen] = React.useState(false);
  const { canInstall, install } = useInstallPrompt();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  // « Plus » = le reste qui n'est pas une grande section (messagerie, admin).
  const extraLinks = [
    { href: "/dashboard/messages", label: "Messagerie", icon: MessagesSquare },
    ...(role === "ADMIN" ? [{ href: "/dashboard/admin", label: "Admin", icon: Shield }] : []),
  ];
  const moreActive = extraLinks.some((l) => isActive(l.href));

  return (
    <>
      {/* Feuille « Plus » */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-border bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted" />
              <div className="mb-2 flex items-center justify-between">
                <p className="font-display text-lg font-bold">Plus</p>
                <button onClick={() => setMoreOpen(false)} className="rounded-full p-1.5 hover:bg-secondary" aria-label="Fermer">
                  <X className="size-5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {extraLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center text-xs font-medium transition-colors",
                      isActive(l.href) ? "border-club bg-club/10 text-club" : "hover:bg-secondary",
                    )}
                  >
                    <l.icon className="size-5" />
                    {l.label}
                  </Link>
                ))}
              </div>

              <div className="mt-3 grid gap-2">
                {canInstall && (
                  <button
                    onClick={install}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-club py-3 text-sm font-semibold text-white"
                  >
                    <Download className="size-4" /> Installer l'application
                  </button>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold text-muted-foreground hover:bg-secondary"
                >
                  <LogOut className="size-4" /> Se déconnecter
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Barre d'onglets */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-6">
          {TABS.map((t) => {
            const active =
              isActive(t.href, t.exact) ||
              (t.extra?.some((e) => pathname === e || pathname.startsWith(e + "/")) ?? false);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-club" : "text-muted-foreground",
                )}
              >
                <t.icon className={cn("size-5", active && "scale-110")} />
                {t.label}
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
              moreActive ? "text-club" : "text-muted-foreground",
            )}
          >
            <Menu className="size-5" />
            Plus
          </button>
        </div>
      </nav>
    </>
  );
}
