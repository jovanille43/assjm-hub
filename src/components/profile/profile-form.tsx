"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Save, KeyRound, Eye, EyeOff, ImageUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "@/components/ui/toast";
import { updateProfile, changePassword, uploadAvatar } from "@/app/dashboard/profil/actions";

type ProfileData = {
  name: string;
  email: string;
  bio: string | null;
  phone: string | null;
  image: string | null;
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function ProfileForm({ user }: { user: ProfileData }) {
  const router = useRouter();
  const { update } = useSession();

  const [name, setName] = React.useState(user.name);
  const [bio, setBio] = React.useState(user.bio ?? "");
  const [phone, setPhone] = React.useState(user.phone ?? "");
  const [image, setImage] = React.useState(user.image ?? "");
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadAvatar(fd);
    setUploading(false);
    if (res.error) return toast.error(res.error);
    if (res.url) {
      setImage(res.url);
      toast.success("Photo importée");
      await update();
      router.refresh();
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile({ name, bio, phone, image });
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Profil mis à jour");
    await update(); // rafraîchit la session → avatar à jour dans le header
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={saveProfile} className="space-y-5">
        {/* Aperçu avatar + upload */}
        <div className="flex items-center gap-4">
          <Avatar name={name || "?"} src={image || null} size="xl" />
          <div className="flex-1 space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={onPickFile}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
              Importer une photo
            </Button>
            <Field label="…ou colle une URL" hint="Laisse vide pour afficher tes initiales.">
              <Input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://…/photo.jpg"
              />
            </Field>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nom affiché">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              placeholder="Ton nom"
            />
          </Field>
          <Field label="Email" hint="Contacte un admin pour modifier ton email.">
            <Input value={user.email} disabled />
          </Field>
        </div>

        <Field label="Téléphone" hint="Visible par le staff du club uniquement.">
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="06 12 34 56 78"
          />
        </Field>

        <Field label="Bio">
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={280}
            placeholder="Quelques mots sur toi, ton poste, ton parcours au club…"
          />
        </Field>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Enregistrer les modifications
          </Button>
        </div>
      </form>

      <div className="border-t pt-6">
        <PasswordSection />
      </div>
    </div>
  );
}

function PasswordSection() {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      toast.error("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    setSaving(true);
    const res = await changePassword({ current, next });
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Mot de passe modifié");
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h3 className="flex items-center gap-2 font-display text-lg font-bold">
        <KeyRound className="size-4 text-club" /> Changer mon mot de passe
      </h3>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="Mot de passe actuel"
          autoComplete="current-password"
          required
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
          aria-label={show ? "Masquer" : "Afficher"}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          type={show ? "text" : "password"}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="Nouveau mot de passe"
          autoComplete="new-password"
          minLength={6}
          required
        />
        <Input
          type={show ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirmer"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="outline" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          Modifier le mot de passe
        </Button>
      </div>
    </form>
  );
}
