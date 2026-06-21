import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { getPostMatch } from "@/lib/postmatch";
import { PostMatchBoard } from "@/components/match/post-match-board";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Star du match" };

export default async function ApresMatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  const { id } = await params;

  const data = await getPostMatch(id, session.user.id, session.user.role ?? "");
  if (!data) notFound();

  return (
    <div className="container max-w-2xl pb-8 pt-8 md:pb-16">
      <Link href="/dashboard/apres-match" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Tous les matchs
      </Link>
      {!data.finished ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          La 3ᵉ mi-temps s'ouvrira une fois le résultat du match saisi.
        </div>
      ) : (
        <PostMatchBoard data={data} />
      )}
    </div>
  );
}
