import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowUpRight, Newspaper } from "lucide-react";
import { SectionHeading } from "@/components/home/section-heading";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";

type News = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: Date;
};

const COVERS = [
  "from-navy-700 via-navy-800 to-navy-950",
  "from-club-700 via-club-800 to-navy-950",
  "from-blue-700 via-navy-800 to-navy-950",
];

export function NewsSection({ news }: { news: News[] }) {
  return (
    <section id="actualites" className="section scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Actualités"
          title={
            <>
              Les dernières <span className="text-gradient">nouvelles</span>
            </>
          }
          description="Toute la vie du club, en direct."
        />
        <Link
          href="/#actualites"
          className="group inline-flex items-center gap-1 text-sm font-semibold text-club"
        >
          Tout voir
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {news.length === 0 ? (
        <p className="mt-10 text-muted-foreground">
          Aucune actualité pour le moment.
        </p>
      ) : (
        <StaggerGroup className="mt-12 grid gap-6 md:grid-cols-3">
          {news.map((article, i) => (
            <StaggerItem key={article.id}>
              <Link
                href={`/#actualites`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1.5 hover:shadow-card"
              >
                <div
                  className={`relative aspect-[16/10] overflow-hidden bg-gradient-to-br ${COVERS[i % COVERS.length]}`}
                >
                  <div className="absolute inset-0 bg-grid opacity-40" />
                  <Newspaper className="absolute bottom-4 right-4 size-16 text-white/10" />
                  <Badge className="absolute left-4 top-4">{article.category}</Badge>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <time className="text-xs uppercase tracking-wider text-muted-foreground">
                    {format(new Date(article.publishedAt), "d MMMM yyyy", { locale: fr })}
                  </time>
                  <h3 className="mt-2 font-display text-lg font-bold leading-snug transition-colors group-hover:text-club">
                    {article.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {article.excerpt}
                  </p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </section>
  );
}
