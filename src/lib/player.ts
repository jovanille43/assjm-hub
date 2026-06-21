import { db } from "@/lib/db";

/** Découpe « Léo Berger » en prénom / nom. */
export function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: parts[0] ?? "Membre", lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/**
 * Garantit qu'un utilisateur possède une carte joueur (FUT).
 * Idempotent : ne fait rien s'il en a déjà une. Stats par défaut (70) via le schéma,
 * sans équipe (n'apparaît donc pas dans les rosters publics tant qu'un admin ne
 * lui assigne pas d'équipe).
 */
export async function ensurePlayerForUser(userId: string): Promise<void> {
  const existing = await db.player.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (existing) return;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  if (!user) return;

  const { firstName, lastName } = splitName(user.name);
  await db.player.create({
    data: { userId, firstName, lastName, position: "MID" },
  });
}
