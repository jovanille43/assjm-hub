"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { syncBadges } from "@/lib/badges";

export async function createPost(content: string, category = "GENERAL") {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorisé");
  const text = content.trim();
  if (!text) return;
  await db.post.create({
    data: { authorId: session.user.id, content: text.slice(0, 2000), category },
  });
  await syncBadges(session.user.id).catch(() => {}); // âme du vestiaire (contributions)
  revalidatePath("/dashboard/social");
}

export async function toggleLike(postId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorisé");
  const existing = await db.like.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
  });
  if (existing) {
    await db.like.delete({ where: { id: existing.id } });
  } else {
    await db.like.create({ data: { postId, userId: session.user.id } });
    await syncBadges(session.user.id).catch(() => {}); // fan fidèle (likes donnés)
  }
  revalidatePath("/dashboard/social");
}

export async function addComment(postId: string, content: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorisé");
  const text = content.trim();
  if (!text) return;
  await db.comment.create({
    data: { postId, authorId: session.user.id, content: text.slice(0, 500) },
  });
  await syncBadges(session.user.id).catch(() => {}); // âme du vestiaire (contributions)
  revalidatePath("/dashboard/social");
}
