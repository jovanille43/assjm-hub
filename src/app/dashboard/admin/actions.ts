"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { ensurePlayerForUser } from "@/lib/player";
import { syncBadges } from "@/lib/badges";
import { notify, notifyMany } from "@/lib/notifications";
import { ROLES } from "@/lib/enums";
import { saveUploadedImage } from "@/lib/upload";

const ALLOWED_ROLES = [
  "ADMIN",
  "DIRIGEANT",
  "COACH",
  "JOUEUR",
  "SUPPORTER",
];

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Réservé aux administrateurs");
  }
  return session;
}

export async function closeSeason(): Promise<{ error?: string; ok?: boolean }> {
  const session = await requireAdmin();

  const top = await db.user.findMany({
    orderBy: { points: "desc" },
    take: 3,
    where: { points: { gt: 0 } },
    select: { id: true, name: true, points: true },
  });
  const medals = ["🥇", "🥈", "🥉"];
  const podium = top.map((u, i) => `${medals[i]} ${u.name} (${u.points} pts)`).join(" · ") || "—";
  const year = new Date().getFullYear();

  // Palmarès archivé dans les actualités (= hall of fame).
  await db.newsArticle.create({
    data: {
      slug: `palmares-saison-${year}-${Math.random().toString(36).slice(2, 6)}`,
      title: `🏆 Palmarès de la saison ${year}`,
      excerpt: `Classement final : ${podium}`,
      content: `Bravo à toutes et tous pour cette saison !\n\nPodium des points : ${podium}\n\nLes compteurs de points sont remis à zéro pour la nouvelle saison. Vos badges et cartes restent acquis.`,
      category: "PALMARÈS",
      authorName: session.user.name,
    },
  });

  // Remise à zéro.
  await db.user.updateMany({ data: { points: 0 } });

  const all = await db.user.findMany({ select: { id: true } });
  await notifyMany(all.map((u) => u.id), {
    type: "INFO",
    title: "Nouvelle saison ! 🎉",
    body: "Les points repartent à zéro. Le palmarès de la saison est dans les actus.",
    link: "/",
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/classement");
  revalidatePath("/dashboard/admin");
  return { ok: true };
}

export async function resetUserPassword(userId: string): Promise<{ error?: string; password?: string }> {
  await requireAdmin();
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return { error: "Utilisateur introuvable." };

  const temp = `assjm-${Math.random().toString(36).slice(2, 8)}`;
  await db.user.update({ where: { id: userId }, data: { hashedPassword: bcrypt.hashSync(temp, 10) } });
  await notify(userId, {
    type: "INFO",
    title: "Mot de passe réinitialisé",
    body: "Un administrateur a réinitialisé ton mot de passe. Connecte-toi puis change-le.",
    link: "/dashboard/profil",
  });
  revalidatePath("/dashboard/admin");
  return { password: temp };
}

export async function deleteUser(userId: string): Promise<{ error?: string }> {
  const session = await requireAdmin();
  if (session.user.id === userId) return { error: "Tu ne peux pas supprimer ton propre compte." };
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return { error: "Utilisateur introuvable." };
  await db.user.delete({ where: { id: userId } });
  revalidatePath("/dashboard/admin");
  return {};
}

export async function setUserRole(userId: string, role: string) {
  await requireAdmin();
  if (!ALLOWED_ROLES.includes(role)) throw new Error("Rôle invalide");
  await db.user.update({ where: { id: userId }, data: { role } });
  // Passage Joueur → on garantit l'existence de sa carte FUT.
  if (role === "JOUEUR") await ensurePlayerForUser(userId);
  await notify(userId, {
    type: "ROLE",
    title: `Ton rôle a changé : ${ROLES[role as keyof typeof ROLES] ?? role}`,
    body: role === "JOUEUR" ? "Ta carte FUT est prête sur ton tableau de bord !" : undefined,
    link: "/dashboard",
  });
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard");
  revalidatePath("/joueurs");
}

export async function createNews(data: {
  title: string;
  excerpt: string;
  content: string;
  category?: string;
}) {
  const session = await requireAdmin();
  const title = data.title.trim();
  if (!title) return;
  const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 7)}`;
  await db.newsArticle.create({
    data: {
      slug,
      title,
      excerpt: data.excerpt.trim() || title,
      content: data.content.trim() || data.excerpt.trim() || title,
      category: data.category?.trim() || "ACTUALITÉ",
      authorName: session.user.name,
    },
  });
  revalidatePath("/dashboard/admin");
  revalidatePath("/");
}

export async function addGalleryItem(formData: FormData): Promise<{ error?: string }> {
  const guard = await requireStaff();
  if (guard.error) return guard;

  const raw = formData.get("file");
  if (!raw || typeof raw === "string" || !(raw as Blob).size) return { error: "Aucune image." };
  const res = await saveUploadedImage(raw as File);
  if (res.error || !res.url) return { error: res.error ?? "Échec de l'upload." };

  await db.galleryItem.create({
    data: {
      type: "PHOTO",
      url: res.url,
      caption: (formData.get("caption") as string)?.trim() || null,
    },
  });
  revalidatePath("/dashboard/admin");
  revalidatePath("/galerie");
  return {};
}

export async function deleteNews(id: string) {
  await requireAdmin();
  await db.newsArticle.delete({ where: { id } });
  revalidatePath("/dashboard/admin");
  revalidatePath("/");
}

export async function updatePlayerStats(
  playerId: string,
  stats: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
    position: string;
    number: number | null;
    teamId?: string | null;
  },
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };
  const role = session.user.role ?? "";
  if (!["ADMIN", "COACH", "DIRIGEANT"].includes(role)) return { error: "Réservé au staff" };

  const clamp = (v: number) => Math.max(1, Math.min(99, Math.round(v)));

  const updated = await db.player.update({
    where: { id: playerId },
    data: {
      pace: clamp(stats.pace),
      shooting: clamp(stats.shooting),
      passing: clamp(stats.passing),
      dribbling: clamp(stats.dribbling),
      defending: clamp(stats.defending),
      physical: clamp(stats.physical),
      position: stats.position,
      number: stats.number,
      ...("teamId" in stats ? { teamId: stats.teamId || null } : {}),
    },
    select: { userId: true },
  });

  // Stats modifiées → réévalue les badges du joueur concerné (ex. All Star, Le Mur).
  if (updated.userId) await syncBadges(updated.userId).catch(() => {});

  revalidatePath("/dashboard/admin");
  revalidatePath("/joueurs");
  revalidatePath("/dashboard");
  return {};
}

async function requireStaff(): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };
  const role = session.user.role ?? "";
  if (!["ADMIN", "COACH", "DIRIGEANT"].includes(role)) return { error: "Réservé au staff" };
  return {};
}

const PLAYER_PATHS = ["/dashboard/admin", "/joueurs", "/equipes", "/dashboard", "/stats"];

export async function createPlayer(data: {
  firstName: string;
  lastName: string;
  position: string;
  number: number | null;
  teamId: string | null;
}): Promise<{ error?: string }> {
  const guard = await requireStaff();
  if (guard.error) return guard;

  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();
  if (!firstName || !lastName) return { error: "Prénom et nom requis." };
  if (!["GK", "DEF", "MID", "FWD"].includes(data.position)) return { error: "Poste invalide." };
  if (data.number != null && (data.number < 1 || data.number > 99)) {
    return { error: "Numéro entre 1 et 99." };
  }

  await db.player.create({
    data: {
      firstName,
      lastName,
      position: data.position,
      number: data.number,
      teamId: data.teamId || null,
      // Stats par défaut (70 partout) — à ajuster ensuite avec les curseurs
    },
  });

  PLAYER_PATHS.forEach((p) => revalidatePath(p));
  return {};
}

export async function deletePlayer(playerId: string): Promise<{ error?: string }> {
  const guard = await requireStaff();
  if (guard.error) return guard;

  // Supprime la fiche joueur (stats de match et convocations suivent en cascade).
  // Le compte utilisateur lié, lui, n'est pas touché.
  await db.player.delete({ where: { id: playerId } });

  PLAYER_PATHS.forEach((p) => revalidatePath(p));
  return {};
}

const TEAM_PATHS = ["/dashboard/admin", "/equipes", "/dashboard/club", "/dashboard/match-center", "/dashboard/convocations"];

export async function createTeam(data: {
  name: string;
  category: string;
}): Promise<{ error?: string }> {
  await requireAdmin();
  const name = data.name.trim();
  if (!name) return { error: "Nom requis." };
  const validCategories = ["U7", "U9", "U11", "U13", "U15", "U18", "SENIOR_A", "SENIOR_B", "VETERAN", "FEMININE"];
  if (!validCategories.includes(data.category)) return { error: "Catégorie invalide." };

  const base = slugify(name);
  const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;

  await db.team.create({
    data: { name, slug, category: data.category },
  });

  TEAM_PATHS.forEach((p) => revalidatePath(p));
  return {};
}

export async function deleteTeam(teamId: string): Promise<{ error?: string }> {
  await requireAdmin();

  const team = await db.team.findUnique({
    where: { id: teamId },
    select: { _count: { select: { players: true, matches: true } } },
  });
  if (!team) return { error: "Équipe introuvable." };
  if (team._count.players > 0 || team._count.matches > 0) {
    return { error: "Impossible de supprimer une équipe qui a encore des joueurs ou des matchs." };
  }

  await db.team.delete({ where: { id: teamId } });

  TEAM_PATHS.forEach((p) => revalidatePath(p));
  return {};
}

const SPONSOR_TIERS = ["PLATINUM", "GOLD", "SILVER", "PARTNER"];

export async function createSponsor(formData: FormData): Promise<{ error?: string }> {
  const guard = await requireStaff();
  if (guard.error) return guard;

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Nom du sponsor requis." };
  const url = (formData.get("url") as string)?.trim() || null;
  const tierRaw = (formData.get("tier") as string)?.trim() || "PARTNER";
  const tier = SPONSOR_TIERS.includes(tierRaw) ? tierRaw : "PARTNER";

  // Logo optionnel : on accepte un fichier image (uploadé vers le stockage).
  let logo: string | null = null;
  const file = formData.get("logo");
  if (file && typeof file !== "string" && (file as Blob).size) {
    const res = await saveUploadedImage(file as File);
    if (res.error || !res.url) return { error: res.error ?? "Échec de l'upload du logo." };
    logo = res.url;
  }

  const max = await db.sponsor.aggregate({ _max: { order: true } });
  const order = (max._max.order ?? 0) + 1;

  await db.sponsor.create({ data: { name, url, tier, logo, order } });
  revalidatePath("/dashboard/admin");
  revalidatePath("/");
  return {};
}

export async function deleteSponsor(id: string): Promise<{ error?: string }> {
  const guard = await requireStaff();
  if (guard.error) return guard;
  await db.sponsor.delete({ where: { id } });
  revalidatePath("/dashboard/admin");
  revalidatePath("/");
  return {};
}
