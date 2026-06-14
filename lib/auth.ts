import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Github from "next-auth/providers/github";
import Discord from "next-auth/providers/discord";
import Twitch from "next-auth/providers/twitch";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import db from "./db";
import { verifyPassword } from "./util/password";

export const { auth, handlers, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(db),
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    providers: [
        Github({ allowDangerousEmailAccountLinking: true }),
        Discord({ allowDangerousEmailAccountLinking: true }),
        Twitch({ allowDangerousEmailAccountLinking: true }),
        Google({ allowDangerousEmailAccountLinking: true }),
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const email = typeof credentials.email === "string" ? credentials.email : "";
                const password = typeof credentials.password === "string" ? credentials.password : "";

                if (!email || !password) {
                    return null;
                }

                const user = await db.user.findUnique({
                    where: { email },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        passwordHash: true,
                    },
                });

                if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
                    return null;
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                };
            },
        }),
    ],
    callbacks: {
        jwt({ token, user }) {
            if (user?.id) {
                token.sub = user.id;
            }

            return token;
        },
        session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }

            return session;
        },
    },
})
