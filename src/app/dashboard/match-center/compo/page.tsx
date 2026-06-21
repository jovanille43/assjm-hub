import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, CheckCircle, ClipboardList, LayoutGrid } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Compo pré-match" };

const STAFF = ["ADMIN", "DIRIGEANT", "COACH"];

export default async function CompoListPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  if (!STAFF.includes(session.user.role ?? "")) redirect("/dashboard");

  const matches = await db.match.findMany({
    where: { status: "SCHEDULED" },
    orderBy: { date: "asc" },
    take: 10,
    include: {
      team: true,
      lineup: { select: { id: true, formation: true } },
      _count: { select: { convocations: true } },
    },
  });

  return (
    <div className="container max-w-2xl pb-16 pt-8">
      <Link
        href="/dashboard/match-center"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Centre de match
      </Link>
      <PageHeader
        eyebrow="Staff"
        icon={LayoutGrid}
        title="Compo pré-match"
        subtitle="Dessine ton XI sur un terrain virtuel avant chaque match. Les joueurs verront leur poste."
      />

      {matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Aucun match programmé.
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <Link
              key={m.id}
              href={`/dashboard/match-center/compo/${m.id}`}
              className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-club/40 hover:bg-secondary/30"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {m.team.name}
                </p>
                <p className="mt-0.5 font-display font-bold">
                  vs {m.opponent}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(m.date), "EEEE d MMMM, HH:mm", { locale: fr })}
                  {m.location && ` · ${m.location}`}
                </p>
              </div>
              <div className="shrink-0 text-right">
                {m.lineup ? (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                    <CheckCircle className="size-4" /> {m.lineup.formation}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    <ClipboardList className="inline size-4" /> {m._count.convocations} convoqués
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
