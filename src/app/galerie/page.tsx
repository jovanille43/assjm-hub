import type { Metadata } from "next";
import { Camera, Play } from "lucide-react";
import { db } from "@/lib/db";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Galerie",
  description: "Photos et vidéos de l'AS Saint-Just-Malmont.",
};

const GRADIENTS = [
  "from-navy-700 to-navy-950",
  "from-club-700 to-navy-900",
  "from-blue-700 to-navy-900",
  "from-navy-800 to-club-900",
  "from-navy-600 to-navy-900",
  "from-club-600 to-navy-950",
];

export default async function GaleriePage() {
  const albums = await db.album.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { orderBy: { createdAt: "desc" } } },
  });

  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 pb-14 pt-28 text-white md:pt-32">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900 to-navy-950" />
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="pointer-events-none absolute -right-20 top-0 size-80 rounded-full bg-club/20 blur-[110px]" />
        <div className="container relative">
          <span className="eyebrow text-club">
            <span className="h-px w-6 bg-club" />
            Médias
          </span>
          <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">
            La <span className="text-club">galerie</span>
          </h1>
          <p className="mt-3 max-w-xl text-blue-100/70">
            Les plus belles images de la vie du club, saison après saison.
          </p>
        </div>
      </section>

      <section className="container space-y-12 py-12">
        {albums.length === 0 ? (
          <p className="text-muted-foreground">Aucun album pour le moment.</p>
        ) : (
          albums.map((album) => (
            <Reveal key={album.id}>
              <div className="mb-4 flex items-end justify-between">
                <h2 className="font-display text-2xl font-bold">{album.title}</h2>
                <span className="text-sm text-muted-foreground">
                  {album.items.length} média{album.items.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid auto-rows-[200px] grid-cols-2 gap-4 md:grid-cols-4">
                {album.items.map((item, i) => (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl bg-gradient-to-br",
                      GRADIENTS[i % GRADIENTS.length],
                      i % 5 === 0 && "col-span-2 row-span-2",
                    )}
                  >
                    <div className="absolute inset-0 bg-grid opacity-30" />
                    <div className="absolute inset-0 grid place-items-center">
                      {item.type === "VIDEO" ? (
                        <div className="grid size-14 place-items-center rounded-full bg-white/15 backdrop-blur transition-transform group-hover:scale-110">
                          <Play className="size-6 translate-x-0.5 fill-white text-white" />
                        </div>
                      ) : (
                        <Camera className="size-9 text-white/20 transition-transform group-hover:scale-110" />
                      )}
                    </div>
                    {item.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="text-sm font-medium text-white">{item.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Reveal>
          ))
        )}
      </section>
    </>
  );
}
