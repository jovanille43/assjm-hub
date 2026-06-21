import type { ComponentType } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, Hash, Megaphone, MessagesSquare, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { MessagePanel } from "@/components/messages/message-panel";
import { getChannels, getMessages } from "@/lib/messages";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ICON: Record<string, ComponentType<{ className?: string }>> = {
  Megaphone,
  ClipboardList,
  ShieldCheck,
};

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ canal?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  const role = session.user.role;

  const channels = await getChannels(role);
  const sp = await searchParams;
  const activeKey =
    sp.canal && channels.some((c) => c.key === sp.canal)
      ? sp.canal
      : channels[0]?.key;
  const data = activeKey ? await getMessages(activeKey, role) : null;

  return (
    <div className="container max-w-5xl pb-8 pt-8 md:pb-16">
      <PageHeader
        eyebrow="Messagerie"
        icon={MessagesSquare}
        title="Les canaux du club"
        subtitle="Échange avec l'équipe et le staff selon les canaux."
      />

      <div className="grid gap-4 md:grid-cols-[210px_1fr]">
        <aside className="flex gap-2 md:flex-col">
          {channels.map((c) => {
            const Icon = ICON[c.icon ?? ""] ?? Hash;
            const active = c.key === activeKey;
            return (
              <Link
                key={c.id}
                href={`/dashboard/messages?canal=${c.key}`}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "border-club bg-club text-white" : "bg-card hover:border-club/40",
                )}
              >
                <Icon className="size-4" />
                {c.name}
              </Link>
            );
          })}
        </aside>

        {data ? (
          <MessagePanel
            channelKey={data.channel.key}
            channelName={data.channel.name}
            messages={data.messages}
            meId={session.user.id}
          />
        ) : (
          <Card className="grid place-items-center p-12 text-muted-foreground">
            Sélectionne un canal.
          </Card>
        )}
      </div>
    </div>
  );
}
