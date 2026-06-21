"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ImageUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { addGalleryItem } from "@/app/dashboard/admin/actions";

export function GalleryUploader() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const res = await addGalleryItem(fd);
    setBusy(false);
    if (res?.error) return toast.error(res.error);
    toast.success("Photo ajoutée à la galerie");
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      <input
        type="file"
        name="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        required
        className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
      />
      <input
        type="text"
        name="caption"
        placeholder="Légende (optionnelle)"
        className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-club"
      />
      <Button type="submit" size="sm" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
        Publier la photo
      </Button>
    </form>
  );
}
