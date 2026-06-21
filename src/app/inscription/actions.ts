"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { syncBadges } from "@/lib/badges";
import { ensurePlayerForUser } from "@/lib/player";

export async function registerUser(formData: FormData): Promise<{ error?: string }> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!name || !email || !password) return { error: "Tous les champs sont requis." };
  if (name.length < 2) return { error: "Le prénom et nom doivent faire au moins 2 caractères." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Adresse email invalide." };
  if (password.length < 6) return { error: "Mot de passe trop court (6 caractères minimum)." };
  if (password !== confirm) return { error: "Les mots de passe ne correspondent pas." };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "Cette adresse email est déjà utilisée." };

  const hashed = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: { name, email, hashedPassword: hashed, role: "SUPPORTER" },
  });

  // Chaque membre a sa carte FUT dès l'inscription (sans équipe au départ).
  await ensurePlayerForUser(user.id).catch(() => {});

  // Le moteur de badges attribue « Nouveau membre » (et tout badge déjà mérité)
  await syncBadges(user.id).catch(() => {});

  return {};
}
