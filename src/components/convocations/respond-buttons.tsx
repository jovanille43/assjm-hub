"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, HelpCircle, Loader2, X } from "lucide-react";
import { respondConvocation } from "@/app/dashboard/convocations/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RespondButtons({
  convocationId,
  status,
}: {
  convocationId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [showReason, setShowReason] = React.useState(false);
  const [reason, setReason] = React.useState("");

  function respond(next: "ACCEPTED" | "DECLINED" | "UNCERTAIN", r?: string) {
    startTransition(async () => {
      await respondConvocation(convocationId, next, r);
      setShowReason(false);
      setReason("");
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => respond("ACCEPTED")}
          className={cn(
            status === "ACCEPTED" &&
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
          onClick={() => respond("UNCERTAIN")}
          className={cn(
            status === "UNCERTAIN" &&
              "border-amber-500 bg-amber-500 text-white hover:bg-amber-600 hover:text-white",
          )}
        >
          <HelpCircle className="size-4" />
          Incertain
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => setShowReason((v) => !v)}
          className={cn(
            status === "DECLINED" &&
              "border-club bg-club text-white hover:bg-club-600 hover:text-white",
          )}
        >
          <X className="size-4" />
          Absent
        </Button>
      </div>

      {showReason && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motif (ex: blessé, indisponible...)"
            className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-club"
          />
          <Button size="sm" disabled={pending} onClick={() => respond("DECLINED", reason)}>
            Confirmer l'absence
          </Button>
        </div>
      )}
    </div>
  );
}
