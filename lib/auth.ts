import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Github from "next-auth/providers/github";
import Discord from "next-auth/providers/discord";
import Twitch from "next-auth/providers/twitch";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import db from "./db";
import { verifyPassword } from "./util/password";
import { USERNAME_MAX_LENGTH, USERNAME_PATTERN } from "./account/username";

export const OAUTH_USERNAME_COOKIE = "trackgames-oauth-username";
const loginProviders = new Set(["google", "github", "twitch", "discord"]);

export const { auth, handlers, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(db),
    trustHost: true,
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    providers: [
        Github,
        Discord,
        Twitch,
        Google,
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
        async signIn({ user, account }) {
            if (!account || account.provider === "credentials" || !loginProviders.has(account.provider)) {
                return true;
            }

            const linkedAccount = await db.account.findUnique({
                where: {
                    provider_providerAccountId: {
                        provider: account.provider,
                        providerAccountId: account.providerAccountId,
                    },
                },
                select: { id: true },
            });

            if (linkedAccount) {
                return true;
            }

            const session = await auth();

            if (session?.user?.id) {
                return true;
            }

            if (user.email) {
                const existingEmail = await db.user.findUnique({
                    where: { email: user.email },
                    select: { id: true },
                });

                if (existingEmail) {
                    return true;
                }
            }

            const username = (await cookies()).get(OAUTH_USERNAME_COOKIE)?.value;

            if (!username || username.length > USERNAME_MAX_LENGTH || !USERNAME_PATTERN.test(username)) {
                return "/login?mode=register&error=OAuthUsernameRequired";
            }

            const existingName = await db.user.findFirst({
                where: { name: username },
                select: { id: true },
            });

            if (existingName) {
                return "/login?mode=register&error=OAuthUsernameTaken";
            }

            user.name = username;

            return true;
        },
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
