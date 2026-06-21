"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const STAFF = ["COACH", "DIRIGEANT", "ADMIN"];

export type SlotInput = { role: string; slotIndex: number; playerId: string };

export async function saveLineup(
  matchId: string,
  formation: string,
  slots: SlotInput[],
  notes?: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user || !STAFF.includes(session.user.role ?? "")) {
    return { error: "Réservé au staff." };
  }

  const lineup = await db.lineup.upsert({
    where: { matchId },
    create: { matchId, formation, notes: notes?.trim() || null },
    update: { formation, notes: notes?.trim() || null },
  });

  // Remplacer tous les slots
  await db.lineupSlot.deleteMany({ where: { lineupId: lineup.id } });
  if (slots.length > 0) {
    await db.lineupSlot.createMany({
      data: slots.map((s) => ({
        lineupId: lineup.id,
        playerId: s.playerId,
        role: s.role,
        slotIndex: s.slotIndex,
      })),
    });
  }

  revalidatePath(`/dashboard/match-center/compo`);
  revalidatePath("/dashboard/convocations");
  return {};
}
