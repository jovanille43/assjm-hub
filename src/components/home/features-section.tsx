import {
  CalendarCheck,
  Heart,
  IdCard,
  BarChart3,
  Trophy,
  Images,
} from "lucide-react";
import { SectionHeading } from "@/components/home/section-heading";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Calendrier & convocations",
    text: "Matchs, entraînements, événements. Convocations en un clic, réponses des joueurs en temps réel.",
    accent: "from-blue-500/20 to-blue-500/5 text-blue-500",
  },
  {
    icon: Heart,
    title: "Réseau social du club",
    text: "Publiez, commentez, likez. Les moments forts du club, partagés par toute la communauté.",
    accent: "from-club/20 to-club/5 text-club",
  },
  {
    icon: IdCard,
    title: "Cartes joueurs FUT",
    text: "Chaque licencié a sa carte façon Ultimate Team, avec ses stats et son évolution.",
    accent: "from-amber-500/20 to-amber-500/5 text-amber-500",
  },
  {
    icon: BarChart3,
    title: "Statistiques vivantes",
    text: "Buteurs, passeurs, présences, séries. Tout est visuel, animé et amusant à suivre.",
    accent: "from-emerald-500/20 to-emerald-500/5 text-emerald-500",
  },
  {
    icon: Trophy,
    title: "Gamification & packs",
    text: "Gagnez des points, débloquez des badges et ouvrez des packs façon FUT. Joueur du mois & MVP.",
    accent: "from-purple-500/20 to-purple-500/5 text-purple-500",
  },
  {
    icon: Images,
    title: "Galerie du club",
    text: "Photos, vidéos et albums pour revivre les grands moments du club.",
    accent: "from-cyan-500/20 to-cyan-500/5 text-cyan-500",
  },
];

export function FeaturesSection() {
  return (
    <section className="section">
      <SectionHeading
        align="center"
        eyebrow="La plateforme"
        title={
          <>
            Une seule appli pour{" "}
            <span className="text-gradient">faire vivre le club</span>
          </>
        }
        description="Le meilleur de SportEasy, Instagram, Discord et Ultimate Team — réuni et pensé pour un club amateur français."
      />

      <StaggerGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <StaggerItem
            key={f.title}
            className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1.5 hover:shadow-card"
          >
            <div
              className={`mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent}`}
            >
              <f.icon className="size-6" />
            </div>
            <h3 className="font-display text-xl font-bold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            <div className="absolute -right-6 -top-6 size-20 rounded-full bg-club/5 opacity-0 transition-opacity group-hover:opacity-100" />
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
