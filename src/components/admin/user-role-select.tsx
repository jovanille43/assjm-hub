"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { setUserRole } from "@/app/dashboard/admin/actions";
import { toast } from "@/components/ui/toast";
import { ROLES } from "@/lib/enums";

export function UserRoleSelect({
  userId,
  role,
}: {
  userId: string;
  role: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <select
      value={role}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          try {
            await setUserRole(userId, next);
            router.refresh();
            toast.success(`Rôle mis à jour : ${ROLES[next as keyof typeof ROLES] ?? next}`);
          } catch {
            toast.error("Impossible de modifier le rôle.");
          }
        });
      }}
      className="rounded-lg border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-club disabled:opacity-50"
    >
      {Object.entries(ROLES).map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}
