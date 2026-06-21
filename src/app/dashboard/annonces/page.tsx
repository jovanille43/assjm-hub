import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Megaphone, Pin } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { AnnouncementForm, DeleteAnnouncementButton } from "./announcement-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Annonces" };

const STAFF = ["ADMIN", "DIRIGEANT", "COACH"];

export default async function AnnoncesPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const isStaff = STAFF.includes(session.user.role ?? "");
  const player = isStaff
    ? null
    : await db.player.findUnique({
        where: { userId: session.user.id },
        select: { teamId: true },
      });

  const [announcements, teams] = await Promise.all([
    db.announcement.findMany({
      where: isStaff
        ? {}
        : {
            OR: [
              { teamId: null },
              ...(player?.teamId ? [{ teamId: player.teamId }] : []),
            ],
          },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      include: { author: { select: { name: true } }, team: { select: { name: true } } },
      take: 30,
    }),
    isStaff
      ? db.team.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
      : Promise.resolve([]),
  ]);

  return (
    <div className="container max-w-2xl pb-16 pt-8">
      <PageHeader
        eyebrow="Club"
        icon={Megaphone}
        title="Annonces"
        subtitle={
          isStaff
            ? "Publie des messages ciblés à une équipe ou à tout le club."
            : "Les annonces du staff pour ton équipe et le club."
        }
      />

      {isStaff && (
        <div className="mb-6">
          <AnnouncementForm teams={teams} />
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Aucune annonce pour l'instant.
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border bg-card p-5"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {a.pinned && <Pin className="size-3.5 shrink-0 text-club" />}
                  <h2 className="font-display text-base font-bold">{a.title}</h2>
                </div>
                {isStaff && <DeleteAnnouncementButton id={a.id} />}
              </div>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{a.content}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{a.author.name}</span>
                <span>·</span>
                <span>{a.team ? a.team.name : "Tout le club"}</span>
                <span>·</span>
                <span>{format(new Date(a.createdAt), "d MMM yyyy", { locale: fr })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
