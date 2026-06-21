"use client";

import * as React from "react";
import Link from "next/link";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import { Crest } from "@/components/brand/crest";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/#club", label: "Le club" },
  { href: "/equipes", label: "Équipes" },
  { href: "/joueurs", label: "Joueurs" },
  { href: "/calendrier", label: "Calendrier" },
  { href: "/stats", label: "Stats" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { data: session } = useSession();
  const user = session?.user;

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/70 bg-background/80 backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-4 md:h-20">
        <Link href="/" className="flex items-center gap-3" aria-label="Accueil ASSJM HUB">
          <Crest className="h-10 w-auto md:h-12" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-extrabold tracking-tight md:text-xl">
              ASSJM <span className="text-club">HUB</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              St Just Malmont
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user && <NotificationBell />}

          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="navy" size="sm">
                <Link href="/dashboard">
                  <LayoutDashboard className="size-4" />
                  <span className="hidden md:inline">Tableau de bord</span>
                </Link>
              </Button>
              <Link
                href="/dashboard/profil"
                title={`${user.name ?? "Mon profil"} — voir mon profil`}
                className="rounded-full ring-offset-background transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-club focus-visible:ring-offset-2"
              >
                <Avatar name={user.name ?? "?"} src={user.image} size="md" />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Se déconnecter"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : (
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/connexion">Connexion</Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-border bg-background/95 backdrop-blur-xl lg:hidden"
          >
            <div className="container flex flex-col gap-1 py-4">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-3 text-base font-medium hover:bg-secondary"
                >
                  {item.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Button asChild variant="navy" className="mt-2">
                    <Link href="/dashboard" onClick={() => setOpen(false)}>
                      <LayoutDashboard className="size-4" /> Tableau de bord
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="mt-1"
                    onClick={() => {
                      setOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                  >
                    <LogOut className="size-4" /> Se déconnecter
                  </Button>
                </>
              ) : (
                <Button asChild className="mt-2">
                  <Link href="/connexion" onClick={() => setOpen(false)}>
                    Connexion
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
