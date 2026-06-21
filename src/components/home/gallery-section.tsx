import { Camera, Play } from "lucide-react";
import { SectionHeading } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

type Item = { id: string; type: string; caption: string | null };

const GRADIENTS = [
  "from-navy-700 to-navy-950",
  "from-club-700 to-navy-900",
  "from-blue-700 to-navy-900",
  "from-navy-800 to-club-900",
  "from-navy-600 to-navy-900",
  "from-club-600 to-navy-950",
];

export function GallerySection({ items }: { items: Item[] }) {
  return (
    <section id="galerie" className="section scroll-mt-24 bg-secondary/40">
      <SectionHeading
        eyebrow="Galerie"
        title={
          <>
            Les <span className="text-gradient">moments forts</span>
          </>
        }
        description="Revivez les plus belles images de la saison."
      />

      {items.length === 0 ? (
        <p className="mt-10 text-muted-foreground">La galerie se remplit bientôt.</p>
      ) : (
        <Reveal className="mt-12 grid auto-rows-[180px] grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((item, i) => (
            <div
              key={item.id}
              className={cn(
                "group relative overflow-hidden rounded-2xl bg-gradient-to-br",
                GRADIENTS[i % GRADIENTS.length],
                i === 0 && "col-span-2 row-span-2",
              )}
            >
              <div className="absolute inset-0 bg-grid opacity-30" />
              <div className="absolute inset-0 grid place-items-center">
                {item.type === "VIDEO" ? (
                  <div className="grid size-14 place-items-center rounded-full bg-white/15 backdrop-blur transition-transform group-hover:scale-110">
                    <Play className="size-6 translate-x-0.5 fill-white text-white" />
                  </div>
                ) : (
                  <Camera className="size-10 text-white/20 transition-transform group-hover:scale-110" />
                )}
              </div>
              {item.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-sm font-medium text-white">{item.caption}</p>
                </div>
              )}
            </div>
          ))}
        </Reveal>
      )}
    </section>
  );
}
