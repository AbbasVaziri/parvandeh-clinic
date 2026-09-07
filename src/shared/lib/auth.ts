import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/shared/lib/db";
import { authConfig } from "@/shared/lib/auth-config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "ایمیل", type: "email" },
        password: { label: "رمز عبور", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email.trim() : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const { rows } = await db.query<{
          id: string;
          email: string;
          password_hash: string;
        }>(
          `select u.id, u.email, u.password_hash
             from users u
            where lower(u.email) = lower($1)`,
          [email]
        );

        const user = rows[0];
        if (!user) return null;
        const valid = await compare(password, user.password_hash);
        if (!valid) return null;

        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
});
