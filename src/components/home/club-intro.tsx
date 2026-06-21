import { HeartHandshake, GraduationCap, Users, Ribbon } from "lucide-react";
import { Crest } from "@/components/brand/crest";
import { SectionHeading } from "@/components/home/section-heading";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/reveal";

const VALUES = [
  {
    icon: HeartHandshake,
    title: "Convivialité",
    text: "Avant tout, un club où l'on se sent bien, du plus jeune au vétéran.",
  },
  {
    icon: GraduationCap,
    title: "Formation",
    text: "Faire grandir nos jeunes sur et en dehors du terrain.",
  },
  {
    icon: Users,
    title: "Esprit d'équipe",
    text: "On gagne ensemble, on perd ensemble. Toujours unis.",
  },
  {
    icon: Ribbon,
    title: "Patrimoine",
    text: "Fiers de Saint-Just-Malmont et de son histoire passementière.",
  },
];

export function ClubIntro() {
  return (
    <section id="club" className="scroll-mt-24 bg-secondary/40">
      <div className="container grid items-center gap-12 py-20 md:py-28 lg:grid-cols-2">
        {/* Panneau visuel */}
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-navy-950 p-1 shadow-glow-navy">
            <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-navy-800 to-navy-950">
              <div className="absolute inset-0 bg-grid opacity-60" />
              <div className="ribbon-line absolute inset-x-0 top-10 h-1.5 opacity-40 animate-ribbon-slide" />
              <div className="ribbon-line absolute inset-x-0 bottom-10 h-1.5 opacity-40 animate-ribbon-slide" />
              <Crest className="relative z-10 h-72 w-auto drop-shadow-2xl" animated />
              <p className="relative z-10 mt-6 text-sm uppercase tracking-[0.3em] text-blue-100/60">
                Fiers de nos couleurs
              </p>
            </div>
          </div>
        </Reveal>

        {/* Texte + valeurs */}
        <div>
          <SectionHeading
            eyebrow="Le club"
            title={
              <>
                Plus qu'un club,{" "}
                <span className="text-gradient">une famille.</span>
              </>
            }
            description="L'Association Sportive Saint-Just-Malmont fait vivre le football amateur au cœur de la Haute-Loire. De l'école de foot aux vétérans, des centaines de licenciés partagent la même passion et les mêmes couleurs."
          />

          <p className="mt-4 max-w-xl text-muted-foreground">
            Niché dans une commune au riche passé passementier, le club tisse
            depuis des générations des liens aussi solides que les rubans qui ont
            fait la réputation de la région.
          </p>

          <StaggerGroup className="mt-8 grid gap-4 sm:grid-cols-2">
            {VALUES.map((v) => (
              <StaggerItem
                key={v.title}
                className="group rounded-2xl border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-card"
              >
                <div className="mb-3 inline-flex size-11 items-center justify-center rounded-xl bg-club/10 text-club transition-colors group-hover:bg-club group-hover:text-white">
                  <v.icon className="size-5" />
                </div>
                <h3 className="font-display text-lg font-bold">{v.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{v.text}</p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </div>
    </section>
  );
}
