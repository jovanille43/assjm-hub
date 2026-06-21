import { redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  FileText,
  Goal,
  ImageUp,
  MessagesSquare,
  Newspaper,
  ShieldCheck,
  Trophy,
  Users as UsersIcon,
  Shield,
} from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { UserRoleSelect } from "@/components/admin/user-role-select";
import { ResetPasswordButton } from "@/components/admin/reset-password-button";
import { DeleteUserButton } from "@/components/admin/delete-user-button";
import { NewsManager } from "@/components/admin/news-manager";
import { PlayerStatsManager } from "@/components/admin/player-stats-manager";
import { TeamManager } from "@/components/admin/team-manager";
import { GalleryUploader } from "@/components/admin/gallery-uploader";
import { SeasonControl } from "@/components/admin/season-control";
import { getAdminOverview, getAllNews, getAllUsers, getAllPlayers, getAllTeams } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const [overview, users, news, players, teams] = await Promise.all([
    getAdminOverview(),
    getAllUsers(),
    getAllNews(),
    getAllPlayers(),
    getAllTeams(),
  ]);

  const newsForClient = news.map((n) => ({
    id: n.id,
    title: n.title,
    category: n.category,
    date: format(new Date(n.publishedAt), "d MMM yyyy", { locale: fr }),
  }));

  const stats = [
    { label: "Membres", value: overview.users, icon: UsersIcon },
    { label: "Joueurs", value: overview.players, icon: ShieldCheck },
    { label: "Équipes", value: overview.teams, icon: Goal },
    { label: "Posts", value: overview.posts, icon: Newspaper },
    { label: "Messages", value: overview.messages, icon: MessagesSquare },
    { label: "Actus", value: overview.news, icon: FileText },
  ];

  return (
    <div className="container pb-8 pt-8 md:pb-16">
      <PageHeader
        eyebrow="Back-office"
        icon={ShieldCheck}
        title="Administration"
        subtitle="Gère les membres, les rôles, l'effectif, les actualités et la galerie du club."
      />

      {/* Vue d'ensemble */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <s.icon className="mx-auto size-5 text-club" />
            <div className="mt-1 font-display text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Utilisateurs */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
            <UsersIcon className="size-5 text-club" /> Utilisateurs & rôles
          </h2>
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 rounded-xl border bg-secondary/20 p-2.5"
              >
                <Avatar name={u.name} src={u.image} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <ResetPasswordButton userId={u.id} />
                  <UserRoleSelect userId={u.id} role={u.role} />
                  <DeleteUserButton userId={u.id} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Actualités */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
            <Newspaper className="size-5 text-club" /> Actualités
          </h2>
          <NewsManager news={newsForClient} />
        </Card>

        {/* Effectif : ajout, stats, suppression */}
        <Card className="p-6 xl:col-span-1">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
            <ShieldCheck className="size-5 text-club" /> Effectif & stats
          </h2>
          <PlayerStatsManager players={players} teams={teams} />
        </Card>

        {/* Équipes : ajout & suppression */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
            <Shield className="size-5 text-club" /> Équipes
          </h2>
          <TeamManager teams={teams} />
        </Card>

        {/* Galerie : upload photo */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
            <ImageUp className="size-5 text-club" /> Ajouter à la galerie
          </h2>
          <GalleryUploader />
        </Card>

        {/* Saison */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
            <Trophy className="size-5 text-club" /> Saison
          </h2>
          <SeasonControl />
        </Card>
      </div>
    </div>
  );
}
