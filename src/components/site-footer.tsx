import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { Crest } from "@/components/brand/crest";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-navy text-white">
      {/* Ruban passementier en haut du footer */}
      <div className="ribbon-line h-1.5 w-full animate-ribbon-slide" />

      <div className="container grid gap-10 py-16 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3">
            <Crest className="h-14 w-auto" />
            <div className="font-display text-xl font-extrabold">
              ASSJM <span className="text-club">HUB</span>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm text-blue-100/70">
            Le cœur numérique de l'Association Sportive Saint-Just-Malmont.
            Fier de nos couleurs, fier de notre histoire passementière.
          </p>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-blue-100">
            Le club
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-blue-100/70">
            <li><Link href="/#club" className="hover:text-club">Présentation</Link></li>
            <li><Link href="/#resultats" className="hover:text-club">Résultats</Link></li>
            <li><Link href="/#classement" className="hover:text-club">Classement</Link></li>
            <li><Link href="/galerie" className="hover:text-club">Galerie</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-blue-100">
            Plateforme
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-blue-100/70">
            <li><Link href="/connexion" className="hover:text-club">Espace membre</Link></li>
            <li><Link href="/#actualites" className="hover:text-club">Actualités</Link></li>
            <li><Link href="/joueurs" className="hover:text-club">Cartes joueurs</Link></li>
            <li><Link href="/stats" className="hover:text-club">Statistiques</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-blue-100">
            Contact
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-blue-100/70">
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-club" /> Stade municipal, St-Just-Malmont
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-club" /> contact@assjm.fr
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-club" /> 04 71 00 00 00
            </li>
          </ul>
          <div className="mt-4 flex gap-3">
            <a href="#" aria-label="Facebook" className="grid size-9 place-items-center rounded-full bg-white/10 transition-colors hover:bg-club">
              <Facebook className="size-4" />
            </a>
            <a href="#" aria-label="Instagram" className="grid size-9 place-items-center rounded-full bg-white/10 transition-colors hover:bg-club">
              <Instagram className="size-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-blue-100/60 md:flex-row">
          <p>© {new Date().getFullYear()} AS Saint-Just-Malmont — Tous droits réservés.</p>
          <p>
            Fait avec ❤️ pour le club ·{" "}
            <span className="text-blue-100/80">ASSJM HUB</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
