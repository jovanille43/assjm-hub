import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/**
 * Auth.js v5 — authentification par identifiants (email + mot de passe).
 * Stratégie JWT (compatible Credentials), le rôle est porté par le token.
 * Protection des routes côté serveur via `auth()` (pas de middleware edge,
 * pour éviter Prisma/bcrypt sur le runtime edge).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/connexion" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user?.hashedPassword) return null;

        const valid = bcrypt.compareSync(password, user.hashedPassword);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.uid = user.id as string;
        token.role = (user as { role?: string }).role;
        token.picture = (user as { image?: string | null }).image ?? null;
        token.name = user.name ?? token.name;
      }
      // Rafraîchit nom/photo/rôle depuis la BDD quand on appelle session.update()
      // (ex : après changement de photo de profil) → l'avatar suit partout.
      if (trigger === "update" && token.uid) {
        const fresh = await db.user.findUnique({
          where: { id: token.uid as string },
          select: { name: true, image: true, role: true },
        });
        if (fresh) {
          token.name = fresh.name;
          token.picture = fresh.image ?? null;
          token.role = fresh.role;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? session.user.id;
        session.user.role = (token.role as string) ?? "SUPPORTER";
        session.user.image = (token.picture as string | null) ?? null;
        if (token.name) session.user.name = token.name as string;
      }
      return session;
    },
  },
});
