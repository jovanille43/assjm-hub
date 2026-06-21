"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserCheck, UserPlus } from "lucide-react";
import { toggleConvocation } from "@/app/dashboard/convocations/actions";
import { Button } from "@/components/ui/button";

export function ConvokeToggle({
  matchId,
  playerId,
  convened,
}: {
  matchId: string;
  playerId: string;
  convened: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      size="sm"
      variant={convened ? "navy" : "outline"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleConvocation(matchId, playerId);
          router.refresh();
        })
      }
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : convened ? (
        <UserCheck className="size-4" />
      ) : (
        <UserPlus className="size-4" />
      )}
      {convened ? "Convoqué" : "Convoquer"}
    </Button>
  );
}
