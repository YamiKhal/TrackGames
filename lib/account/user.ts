import { CSSProperties } from "react";
import db from "../db";
import { PublicUser, User } from "../types";
import { hexColor } from "../util/normalize";

type SessionUserRef = {
    id?: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
};

export async function getUser(sessionUser: SessionUserRef | undefined): Promise<User | null> {
    if (!sessionUser) return null;

    const profile = await db.user.findFirst({
        where: {
            OR: [
                sessionUser.id ? { id: sessionUser.id } : undefined,
                sessionUser.email ? { email: sessionUser.email } : undefined,
                sessionUser.name ? { name: sessionUser.name } : undefined,
            ].filter(Boolean) as { id?: string; email?: string; name?: string }[],
        },
        select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            image: true,
            background: true,
            bio: true,
            profileColor: true,
            accentColor: true,
            privacy: true,
            socials: true,
            preferences: true,
            widgets: true,
            accounts: {
                select: {
                    provider: true,
                },
            },
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!profile) return null;

    return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        image: profile.image,
        background: profile.background,
        bio: profile.bio,
        profileColor: profile.profileColor,
        accentColor: profile.accentColor,
        privacy: profile.privacy,
        socials: profile.socials,
        preferences: profile.preferences,
        widgets: profile.widgets,
        hasPassword: Boolean(profile.passwordHash),
        linkedProviders: profile.accounts.map((account) => account.provider),
        createdAt: profile.createdAt.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
        updatedAt: profile.updatedAt.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }),
    };
}

export async function getPublicUser(name: string): Promise<PublicUser | null> {
    const user = await db.user.findFirst({
        where: { name },
        select: {
            id: true,
            name: true,
            image: true,
            background: true,
            bio: true,
            profileColor: true,
            accentColor: true,
            socials: true,
            widgets: true,
            createdAt: true
        }
    });

    return user as PublicUser;
}

export function profileThemeStyle(profileColor: string | null | undefined, accentColor: string | null | undefined) {
    const style: CSSProperties & Record<string, string> = {};
    const primary = hexColor(profileColor, "#7b5cdb");
    const secondary = hexColor(accentColor, "#b8842f");

    style["--primary"] = primary;
    style["--primary-hover"] = `color-mix(in srgb, ${primary} 82%, white)`;
    style["--border-strong"] = primary;

    style["--secondary"] = secondary;
    style["--secondary-hover"] = `color-mix(in srgb, ${secondary} 82%, white)`;

    return style;
}
