import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { Crest } from "@/components/brand/crest";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Accédez à votre espace membre ASSJM HUB.",
};

export default async function ConnexionPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <section className="relative grid min-h-[100svh] place-items-center overflow-hidden bg-navy-950 px-4 py-24 text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900 to-navy-950" />
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 size-96 -translate-x-1/2 rounded-full bg-club/20 blur-[120px]" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Crest className="h-24 w-auto" />
          <h1 className="mt-4 font-display text-3xl font-extrabold">Espace membre</h1>
          <p className="mt-2 text-sm text-blue-100/70">
            Connectez-vous pour accéder à votre tableau de bord.
          </p>
        </div>

        <Suspense fallback={<div className="h-64 rounded-3xl border border-white/10 bg-white/5 animate-pulse" />}>
          <LoginForm />
        </Suspense>

        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-sm text-blue-100/60">
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="font-semibold text-blue-100 hover:text-white">
              Créer un compte
            </Link>
          </p>
          <Button asChild variant="ghost" className="text-blue-100 hover:bg-white/10 hover:text-white">
            <Link href="/">
              <ArrowLeft className="size-4" /> Retour à l'accueil
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
