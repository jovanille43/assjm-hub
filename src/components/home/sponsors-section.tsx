import { SectionHeading } from "@/components/home/section-heading";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { Handshake } from "lucide-react";

type Sponsor = {
  id: string;
  name: string;
  tier: string;
  logo: string | null;
  url: string | null;
};

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
          {sponsors.map((s) => {
            const inner = (
              <span className="flex w-full flex-col items-center gap-3 text-center">
                <span className="grid h-20 w-full place-items-center rounded-xl bg-white p-3">
                  {s.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.logo}
                      alt={s.name}
                      className="max-h-full max-w-[85%] object-contain"
                    />
                  ) : (
                    <Handshake className="size-7 text-muted-foreground transition-colors group-hover:text-club" />
                  )}
                </span>
                <span>
                  <span className="block font-display text-base font-bold">{s.name}</span>
                  <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
                    {TIER_LABEL[s.tier] ?? "Partenaire"}
                  </span>
                </span>
              </span>
            );
            return (
              <StaggerItem
                key={s.id}
                className="group rounded-2xl border bg-card p-4 transition-all hover:-translate-y-1 hover:border-club/40 hover:shadow-card"
              >
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex"
                  >
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      )}
    </section>
  );
}
