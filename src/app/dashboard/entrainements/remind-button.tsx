"use client";

import * as React from "react";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { remindTrainingPending } from "./actions";

export function RemindTrainingButton({ eventId, pendingCount }: { eventId: string; pendingCount: number }) {
  const [pending, startTransition] = React.useTransition();
  const [sent, setSent] = React.useState(false);

  if (pendingCount === 0 || sent) return null;

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await remindTrainingPending(eventId);
          setSent(true);
        })
      }
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Bell className="size-3.5" />}
      Relancer ({pendingCount})
    </Button>
  );
}
