import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth: session }) {
      return Boolean(session?.user);
    },
  },
} satisfies NextAuthConfig;
