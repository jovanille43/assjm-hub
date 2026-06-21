import { SectionHeading } from "@/components/home/section-heading";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { Handshake } from "lucide-react";

type Sponsor = { id: string; name: string; tier: string };

const TIER_LABEL: Record<string, string> = {
  PLATINUM: "Partenaire Platine",
  GOLD: "Partenaire Or",
  SILVER: "Partenaire Argent",
  PARTNER: "Partenaire",
};

export function SponsorsSection({ sponsors }: { sponsors: Sponsor[] }) {
  return (
    <section className="section">
      <SectionHeading
        align="center"
        eyebrow="Ils nous soutiennent"
        title={
          <>
            Nos <span className="text-gradient">partenaires</span>
          </>
        }
        description="Le club remercie chaleureusement ceux qui le font vivre au quotidien."
      />

      {sponsors.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">
          Nos partenaires seront bientôt mis à l'honneur.
        </p>
      ) : (
        <StaggerGroup className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {sponsors.map((s) => (
            <StaggerItem
              key={s.id}
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-6 text-center transition-all hover:-translate-y-1 hover:border-club/40 hover:shadow-card"
            >
              <Handshake className="size-7 text-muted-foreground transition-colors group-hover:text-club" />
              <span className="font-display text-lg font-bold">{s.name}</span>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {TIER_LABEL[s.tier] ?? "Partenaire"}
              </span>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </section>
  );
}
