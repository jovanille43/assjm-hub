"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type PackType = "STANDARD" | "PRO" | "ELITE";

export type RewardKind = "POINTS" | "PRONO_BOOST" | "JACKPOT";

export type PackReward = {
  kind: RewardKind;
  label: string;
  description: string;
  icon: string;
  rarity: string;
  points: number;
  pronoBoosts: number;
};

const MAX_FREE_PER_WEEK = 3;

const PACK_COST: Record<PackType, number> = { STANDARD: 0, PRO: 100, ELITE: 250 };
const PACK_MIN_RARITY: Record<PackType, string> = { STANDARD: "COMMON", PRO: "RARE", ELITE: "EPIC" };

const RARITY_ORDER = ["COMMON", "RARE", "EPIC", "LEGENDARY"] as const;
type Rarity = (typeof RARITY_ORDER)[number];

// Probabilité de tomber sur chaque rareté, selon le type de pack.
const RARITY_WEIGHT: Record<PackType, Record<Rarity, number>> = {
  STANDARD: { COMMON: 60, RARE: 26, EPIC: 10, LEGENDARY: 4 },
  PRO: { COMMON: 0, RARE: 60, EPIC: 30, LEGENDARY: 10 },
  ELITE: { COMMON: 0, RARE: 0, EPIC: 70, LEGENDARY: 30 },
};

// Récompenses concrètes : points (monnaie du club) et boosts Prono ×2.
const REWARDS: Record<Rarity, Omit<PackReward, "rarity">[]> = {
  COMMON: [
    { kind: "POINTS", label: "Quelques pièces", description: "Un petit coup de pouce pour ta cagnotte.", icon: "🪙", points: 20, pronoBoosts: 0 },
    { kind: "POINTS", label: "Petite cagnotte", description: "De quoi avancer vers ta prochaine amélioration.", icon: "💵", points: 35, pronoBoosts: 0 },
  ],
  RARE: [
    { kind: "POINTS", label: "Belle cagnotte", description: "Un joli paquet de points pour ta carte.", icon: "💰", points: 60, pronoBoosts: 0 },
    { kind: "POINTS", label: "Prime du club", description: "Un bonus de points bienvenu.", icon: "💵", points: 45, pronoBoosts: 0 },
    { kind: "PRONO_BOOST", label: "Boost Prono ×2", description: "Double les points de ton prochain pronostic.", icon: "🎯", points: 10, pronoBoosts: 1 },
  ],
  EPIC: [
    { kind: "POINTS", label: "Gros pactole", description: "Un apport conséquent pour faire évoluer ta carte.", icon: "💎", points: 120, pronoBoosts: 0 },
    { kind: "POINTS", label: "Pactole renforcé", description: "Un beau paquet de points.", icon: "💎", points: 90, pronoBoosts: 0 },
    { kind: "PRONO_BOOST", label: "Double boost Prono", description: "Deux pronostics doublés.", icon: "🎯", points: 20, pronoBoosts: 2 },
  ],
  LEGENDARY: [
    { kind: "JACKPOT", label: "JACKPOT", description: "Le gros lot ! Une montagne de points.", icon: "🏆", points: 300, pronoBoosts: 0 },
    { kind: "POINTS", label: "Magot légendaire", description: "Un énorme paquet de points.", icon: "💎", points: 180, pronoBoosts: 0 },
    { kind: "PRONO_BOOST", label: "Triple boost Prono", description: "Trois pronostics doublés.", icon: "🎯", points: 30, pronoBoosts: 3 },
  ],
};

function getWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export async function getPackStatus(): Promise<{
  weeklyUsed: number;
  weeklyMax: number;
  userPoints: number;
  pronoBoosts: number;
}> {
  const empty = { weeklyUsed: 0, weeklyMax: MAX_FREE_PER_WEEK, userPoints: 0, pronoBoosts: 0 };
  const session = await auth();
  if (!session?.user) return empty;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { points: true, pronoBoosts: true, weeklyPacksOpened: true, lastPackWeek: true },
  });
  if (!user) return empty;

  const currentWeek = getWeekKey(new Date());
  const weeklyUsed = user.lastPackWeek === currentWeek ? user.weeklyPacksOpened : 0;

  return {
    weeklyUsed,
    weeklyMax: MAX_FREE_PER_WEEK,
    userPoints: user.points,
    pronoBoosts: user.pronoBoosts,
  };
}

function pickRarity(packType: PackType): Rarity {
  const weights = RARITY_WEIGHT[packType];
  const total = RARITY_ORDER.reduce((s, r) => s + weights[r], 0);
  let roll = Math.random() * total;
  for (const r of RARITY_ORDER) {
    roll -= weights[r];
    if (roll <= 0) return r;
  }
  return PACK_MIN_RARITY[packType] as Rarity;
}

export async function openPack(packType: PackType = "STANDARD"): Promise<PackReward> {
  const session = await auth();
  if (!session?.user) throw new Error("Non autorisé");
  const userId = session.user.id;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { points: true, weeklyPacksOpened: true, lastPackWeek: true },
  });
  if (!user) throw new Error("Utilisateur introuvable");

  const currentWeek = getWeekKey(new Date());

  // Coût / limite selon le type de pack
  if (packType === "STANDARD") {
    const weeklyUsed = user.lastPackWeek === currentWeek ? user.weeklyPacksOpened : 0;
    if (weeklyUsed >= MAX_FREE_PER_WEEK) {
      throw new Error(`Limite hebdomadaire atteinte (${MAX_FREE_PER_WEEK} packs/semaine). Reviens lundi ou prends un pack Pro !`);
    }
    await db.user.update({
      where: { id: userId },
      data: { weeklyPacksOpened: weeklyUsed + 1, lastPackWeek: currentWeek },
    });
  } else {
    const cost = PACK_COST[packType];
    if (user.points < cost) {
      throw new Error(`Points insuffisants (${cost} pts requis, tu as ${user.points} pts).`);
    }
    await db.user.update({ where: { id: userId }, data: { points: { decrement: cost } } });
  }

  // Tirage : rareté puis récompense de cette rareté
  const rarity = pickRarity(packType);
  const pool = REWARDS[rarity];
  const base = pool[Math.floor(Math.random() * pool.length)];
  const reward: PackReward = { ...base, rarity };

  await db.user.update({
    where: { id: userId },
    data: {
      points: reward.points > 0 ? { increment: reward.points } : undefined,
      pronoBoosts: reward.pronoBoosts > 0 ? { increment: reward.pronoBoosts } : undefined,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/packs");
  revalidatePath("/dashboard/pronos");
  return reward;
}
