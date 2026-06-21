"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { registerUser } from "@/app/inscription/actions";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showPwd, setShowPwd] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    const result = await registerUser(data);
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      setLoading(false);
      return;
    }
    toast.success("Compte créé ! Connecte-toi pour commencer.");
    router.push("/connexion?registered=1");
  }

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-blue-100/40 focus:border-club";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-blue-100">
            Prénom et nom
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Léo Berger"
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-blue-100">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="vous@exemple.fr"
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-blue-100">
            Mot de passe <span className="text-blue-100/50">(6 caractères min.)</span>
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPwd ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="••••••••"
              className={`${inputCls} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-100/50 hover:text-white"
              tabIndex={-1}
            >
              {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-blue-100">
            Confirmer le mot de passe
          </label>
          <input
            id="confirm"
            name="confirm"
            type={showPwd ? "text" : "password"}
            autoComplete="new-password"
            required
            placeholder="••••••••"
            className={inputCls}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-club/15 px-4 py-2.5 text-sm text-red-300">{error}</p>
        )}

        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading && <Loader2 className="size-4 animate-spin" />}
          Créer mon compte
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-blue-100/60">
        Déjà membre ?{" "}
        <Link href="/connexion" className="font-semibold text-blue-100 hover:text-white">
          Se connecter
        </Link>
      </p>

      <p className="mt-3 text-center text-xs text-blue-100/40">
        Votre compte sera créé avec le rôle Supporter.
        <br />
        Un admin du club peut ensuite vous attribuer le rôle Joueur.
      </p>
    </div>
  );
}
