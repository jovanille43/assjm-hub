import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { getFeed } from "@/lib/social";
import { PostComposer } from "@/components/social/post-composer";
import { PostCard } from "@/components/social/post-card";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  const feed = await getFeed(session.user.id);

  return (
    <div className="container max-w-2xl pb-8 pt-8 md:pb-16">
      <PageHeader
        eyebrow="Communauté"
        icon={MessageCircle}
        title="Le fil du club"
        subtitle="Partage les moments forts, réagis, commente — la vie du club, en direct."
      />

      <PostComposer authorName={session.user.name ?? "Moi"} />

      <div className="mt-6 space-y-5">
        {feed.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            Aucune publication pour l'instant. Sois le premier&nbsp;! ⚽
          </p>
        ) : (
          feed.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </div>
    </div>
  );
}
