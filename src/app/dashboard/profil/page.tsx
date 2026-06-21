import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Info, ShieldCheck, UserCog, Zap } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/profile/profile-form";
import { PushToggle } from "@/components/notifications/push-toggle";
import { ROLES } from "@/lib/enums";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mon profil" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      bio: true,
      phone: true,
      image: true,
      role: true,
      points: true,
    },
  });
  if (!user) redirect("/connexion");

  const role = ROLES[user.role as keyof typeof ROLES] ?? user.role;

  return (
    <div className="container max-w-2xl pb-8 pt-8 md:pb-16">
      <header className="mb-6">
        <span className="eyebrow">
          <span className="h-px w-6 bg-club" />
          Mon compte
        </span>
        <h1 className="mt-2 flex items-center gap-2 font-display text-3xl font-extrabold sm:text-4xl">
          <UserCog className="size-7 text-club" />
          Mon profil
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Badge variant="navy">{role}</Badge>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Zap className="size-4 text-club" />
            {user.points} points
          </span>
        </div>

        {/* Comment changer de statut/rôle */}
        {user.role === "ADMIN" ? (
          <Link
            href="/dashboard/admin"
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-club/30 bg-club/5 px-3 py-2 text-xs text-foreground/80 transition-colors hover:bg-club/10"
          >
            <ShieldCheck className="size-4 text-club" />
            Tu es administrateur — gère les rôles des membres dans le back-office.
          </Link>
        ) : (
          <p className="mt-3 inline-flex items-start gap-2 rounded-xl border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-club" />
            Ton rôle (joueur, coach…) est attribué par le club. Demande à un
            administrateur de te l'attribuer depuis le back-office.
          </p>
        )}
      </header>

      <div className="mb-4">
        <PushToggle />
      </div>

      <Card className="p-6 sm:p-8">
        <ProfileForm
          user={{
            name: user.name,
            email: user.email,
            bio: user.bio,
            phone: user.phone,
            image: user.image,
          }}
        />
      </Card>
    </div>
  );
}
