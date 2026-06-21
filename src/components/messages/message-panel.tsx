"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Send } from "lucide-react";
import { sendMessage } from "@/app/dashboard/messages/actions";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Msg = {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; role: string; image: string | null };
};

export function MessagePanel({
  channelKey,
  channelName,
  messages,
  meId,
}: {
  channelKey: string;
  channelName: string;
  messages: Msg[];
  meId: string;
}) {
  const router = useRouter();
  const [text, setText] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages.length]);

  // Rafraîchissement quasi temps réel
  React.useEffect(() => {
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [router]);

  function send() {
    if (!text.trim()) return;
    startTransition(async () => {
      await sendMessage(channelKey, text);
      setText("");
      router.refresh();
    });
  }

  return (
    <div className="flex h-[62vh] flex-col overflow-hidden rounded-2xl border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="font-display text-lg font-bold"># {channelName}</h2>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucun message. Lance la conversation&nbsp;! 💬
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.author.id === meId;
            return (
              <div
                key={m.id}
                className={cn("flex gap-2", mine && "flex-row-reverse")}
              >
                <Avatar name={m.author.name} src={m.author.image} size="sm" />
                <div className={cn("max-w-[78%]", mine && "text-right")}>
                  <div
                    className={cn(
                      "inline-block rounded-2xl px-3 py-2 text-sm",
                      mine
                        ? "rounded-tr-sm bg-club text-white"
                        : "rounded-tl-sm bg-secondary",
                    )}
                  >
                    {!mine && (
                      <p className="mb-0.5 text-xs font-semibold text-club">
                        {m.author.name}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                  <p className="mt-0.5 px-1 text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true, locale: fr })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={`Message dans #${channelName}...`}
          className="min-w-0 flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-club"
        />
        <Button size="icon" onClick={send} disabled={pending || !text.trim()}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
