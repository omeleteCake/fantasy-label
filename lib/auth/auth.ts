import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Demo Login",
      credentials: { email: { label: "Email", type: "text" } },
      authorize: async (credentials) => {
        const email = credentials.email as string;
        if (!email) return null;
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: email.split("@")[0],
              isAdmin: email === process.env.ADMIN_EMAIL,
              wallet: { create: { balance: Number(process.env.STARTING_CASH ?? "100000") } },
            },
          });
        }
        return { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id as string;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
});
