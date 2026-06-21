import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Phone, Send } from "lucide-react";
import { SectionHeading } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

export function ContactSection() {
  return (
    <section id="contact" className="section scroll-mt-24">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="Rejoignez-nous"
            title={
              <>
                Envie de faire partie de{" "}
                <span className="text-gradient">l'aventure&nbsp;?</span>
              </>
            }
            description="Joueur, parent, bénévole ou supporter : il y a une place pour vous à l'ASSJM. Contactez-nous, on vous accueille avec plaisir."
          />

          <div className="mt-8 space-y-4">
            <a href="#" className="flex items-center gap-3 text-sm">
              <span className="grid size-10 place-items-center rounded-xl bg-club/10 text-club">
                <MapPin className="size-5" />
              </span>
              Stade municipal — Saint-Just-Malmont (43240)
            </a>
            <a href="mailto:contact@assjm.fr" className="flex items-center gap-3 text-sm">
              <span className="grid size-10 place-items-center rounded-xl bg-club/10 text-club">
                <Mail className="size-5" />
              </span>
              contact@assjm.fr
            </a>
            <a href="tel:+33471000000" className="flex items-center gap-3 text-sm">
              <span className="grid size-10 place-items-center rounded-xl bg-club/10 text-club">
                <Phone className="size-5" />
              </span>
              04 71 00 00 00
            </a>
          </div>

          <div className="mt-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Suivez le club
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                aria-label="Facebook"
                className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-club hover:text-club"
              >
                <Facebook className="size-4" /> Facebook
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-club hover:text-club"
              >
                <Instagram className="size-4" /> Instagram
              </a>
            </div>
          </div>
        </div>

        {/* Carte d'invitation */}
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-navy-900 to-navy-950 p-8 text-white md:p-10">
            <div className="absolute inset-0 bg-grid opacity-40" />
            <div className="ribbon-line absolute inset-x-0 top-0 h-1.5 opacity-40 animate-ribbon-slide" />
            <div className="relative">
              <h3 className="font-display text-2xl font-bold">
                Créez votre espace membre
              </h3>
              <p className="mt-3 text-blue-100/80">
                Accédez à votre carte joueur, vos convocations, le réseau social
                du club et bien plus encore.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Votre carte joueur personnalisée",
                  "Convocations & calendrier en temps réel",
                  "Le fil d'actu et la communauté du club",
                  "Statistiques, badges et récompenses",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <span className="grid size-5 place-items-center rounded-full bg-club text-[10px] font-bold">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="mt-8 w-full">
                <Link href="/connexion">
                  Rejoindre le club <Send className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
