"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { respondTraining } from "@/app/dashboard/convocations/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TrainingRespondButtons({
  eventId,
  status,
}: {
  eventId: string;
  status: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function respond(next: "PRESENT" | "ABSENT") {
    startTransition(async () => {
      await respondTraining(eventId, next);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => respond("PRESENT")}
        className={cn(
          status === "PRESENT" &&
            "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white",
        )}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        Présent
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => respond("ABSENT")}
        className={cn(
          status === "ABSENT" &&
            "border-club bg-club text-white hover:bg-club/90 hover:text-white",
        )}
      >
        <X className="size-4" />
        Absent
      </Button>
    </div>
  );
}
