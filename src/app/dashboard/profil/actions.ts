"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { saveUploadedImage } from "@/lib/upload";

export async function updateProfile(data: {
  name: string;
  bio: string;
  phone: string;
  image: string;
}): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };

  const name = data.name.trim();
  if (name.length < 2) return { error: "Le nom doit faire au moins 2 caractères." };

  const image = data.image.trim();
  if (image && !/^https?:\/\/.+/i.test(image)) {
    return { error: "L'URL de la photo doit commencer par http:// ou https://" };
  }

  const phone = data.phone.trim();
  if (phone && !/^[0-9 +().-]{6,20}$/.test(phone)) {
    return { error: "Numéro de téléphone invalide." };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      name,
      bio: data.bio.trim() || null,
      phone: phone || null,
      image: image || null,
    },
  });

  revalidatePath("/dashboard/profil");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function changePassword(data: {
  current: string;
  next: string;
}): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };

  if (data.next.length < 6) {
    return { error: "Le nouveau mot de passe doit faire au moins 6 caractères." };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { hashedPassword: true },
  });
  if (!user?.hashedPassword) {
    return { error: "Aucun mot de passe défini sur ce compte." };
  }

  const valid = bcrypt.compareSync(data.current, user.hashedPassword);
  if (!valid) return { error: "Mot de passe actuel incorrect." };

  const hashed = await bcrypt.hash(data.next, 12);
  await db.user.update({
    where: { id: session.user.id },
    data: { hashedPassword: hashed },
  });

  return { ok: true };
}

export async function uploadAvatar(formData: FormData): Promise<{ url?: string; error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Aucun fichier." };

  const res = await saveUploadedImage(file);
  if (res.error || !res.url) return { error: res.error ?? "Échec de l'upload." };

  await db.user.update({ where: { id: session.user.id }, data: { image: res.url } });
  revalidatePath("/dashboard/profil");
  revalidatePath("/dashboard");
  return { url: res.url };
}
