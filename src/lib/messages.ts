import { db } from "@/lib/db";

const STAFF = ["COACH", "DIRIGEANT", "ADMIN"];
const DIRIGEANTS = ["DIRIGEANT", "ADMIN"];

const DEFAULT_CHANNELS = [
  { key: "club", name: "Canal du club", access: "ALL", icon: "Megaphone", order: 0 },
  { key: "coachs", name: "Coachs", access: "STAFF", icon: "ClipboardList", order: 1 },
  { key: "dirigeants", name: "Dirigeants", access: "DIRIGEANT", icon: "ShieldCheck", order: 2 },
];

export function canAccess(access: string, role: string) {
  if (access === "ALL") return true;
  if (access === "STAFF") return STAFF.includes(role);
  if (access === "DIRIGEANT") return DIRIGEANTS.includes(role);
  return false;
}

export async function ensureChannels() {
  for (const c of DEFAULT_CHANNELS) {
    await db.channel.upsert({ where: { key: c.key }, update: {}, create: c });
  }
}

export async function getChannels(role: string) {
  await ensureChannels();
  const channels = await db.channel.findMany({ orderBy: { order: "asc" } });
  return channels.filter((c) => canAccess(c.access, role));
}

export async function getMessages(channelKey: string, role: string) {
  const channel = await db.channel.findUnique({ where: { key: channelKey } });
  if (!channel || !canAccess(channel.access, role)) return null;

  const messages = await db.message.findMany({
    where: { channelId: channel.id },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { author: true },
  });

  return {
    channel,
    messages: messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      author: { id: m.author.id, name: m.author.name, role: m.author.role, image: m.author.image },
    })),
  };
}
