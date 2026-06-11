"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { auth } from "../auth";
import db from "../db";
import { Prisma } from "../generated/prisma/client";
import { hashPassword, verifyPassword } from "../util/Password";

const tabSchema = z.enum(["profile", "privacy", "widgets", "preferences", "account"]);
const socialPlatformSchema = z.enum(["x", "discord", "github", "twitch", "youtube", "instagram", "tiktok", "website"]);
const socialKindSchema = z.enum(["link", "copy"]);
type SocialLinkValue = {
    platform: z.infer<typeof socialPlatformSchema>;
    kind: z.infer<typeof socialKindSchema>;
    value: string;
};
const nullableText = (max: number) => z.string().trim().max(max).transform((value) => value || null);
const nullableUrl = z.string().trim().max(500).transform((value, ctx) => {
    if (!value) return null;

    try {
        const url = new URL(value);

        if (url.protocol !== "https:") {
            ctx.addIssue({ code: "custom", message: "Only HTTPS URLs are allowed." });
            return z.NEVER;
        }

        return value;
    } catch {
        ctx.addIssue({ code: "custom", message: "Enter a valid HTTPS URL." });
        return z.NEVER;
    }
});

const colorSchema = z.string().trim().transform((value, ctx) => {
    if (!value) return null;
    if (/^#[0-9a-f]{6}$/i.test(value)) return value;

    ctx.addIssue({ code: "custom", message: "Colors must use #RRGGBB format." });
    return z.NEVER;
});

const socialLinksSchema = z.string().trim().max(5000).transform((value, ctx) => {
    if (!value) return null;

    try {
        const parsed = JSON.parse(value);
        const socialLinks = z.array(z.object({
            platform: socialPlatformSchema,
            kind: socialKindSchema.default("link"),
            value: z.string().trim().max(500),
        })).max(20).parse(parsed);
        const normalized: SocialLinkValue[] = [];

        for (const item of socialLinks) {
            if (!item.value) continue;

            if (item.kind === "copy") {
                if (item.value.length > 100) {
                    throw new Error("Copy values must be 100 characters or fewer.");
                }

                normalized.push({ platform: item.platform, kind: item.kind, value: item.value });
                continue;
            }

            const url = new URL(item.value);

            if (url.protocol !== "https:") {
                throw new Error("Only HTTPS URLs are allowed.");
            }

            normalized.push({ platform: item.platform, kind: item.kind, value: item.value });
        }

        return normalized.length > 0 ? JSON.stringify(normalized) : null;
    } catch {
        ctx.addIssue({ code: "custom", message: "Social links must be valid platform/link pairs." });
        return z.NEVER;
    }
});

const settingsSchema = z.object({
    name: z.string().trim().min(1).max(24).optional(),
    bio: nullableText(280).optional(),
    image: nullableUrl.optional(),
    background: nullableUrl.optional(),
    profileColor: colorSchema.optional(),
    accentColor: colorSchema.optional(),
    privacy: z.enum(["public", "followers", "private"]).optional(),
    socials: socialLinksSchema.optional(),
    preferences: nullableText(2000).optional(),
    widgets: nullableText(20000).optional(),
    email: z.union([z.email(), z.literal("")]).transform((value) => value || null).optional(),
    currentPassword: z.string().max(128).optional(),
    newPassword: z.string().max(128).optional(),
    passwordConfirm: z.string().max(128).optional(),
});

async function getCurrentUserId() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if (session.user.id) {
        return session.user.id;
    }

    const user = await db.user.findFirst({
        where: {
            OR: [
                session.user.email ? { email: session.user.email } : undefined,
                session.user.name ? { name: session.user.name } : undefined,
            ].filter(Boolean) as { email?: string; name?: string }[],
        },
        select: { id: true },
    });

    if (!user) {
        redirect("/login");
    }

    return user.id;
}

async function pickAccountUpdateData(userId: string, values: z.infer<typeof settingsSchema>) {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: {
            email: true,
            passwordHash: true,
            accounts: {
                select: { id: true },
            },
        },
    });

    if (!user) {
        redirect("/login");
    }

    const data: Prisma.UserUpdateInput = {};

    if (values.email !== undefined) {
        if (!values.email && user.accounts.length === 0) {
            redirect("/settings?tab=account&edit=1&error=invalid");
        }

        data.email = values.email;
    }

    const wantsPasswordChange = Boolean(values.currentPassword || values.newPassword || values.passwordConfirm);

    if (wantsPasswordChange) {
        const finalEmail = values.email !== undefined ? values.email : user.email;

        if (!finalEmail) {
            redirect("/settings?tab=account&edit=1&error=email-required");
        }

        if (!values.newPassword || values.newPassword.length < 8 || values.newPassword.length > 128 || values.newPassword !== values.passwordConfirm) {
            redirect("/settings?tab=account&edit=1&error=invalid-password");
        }

        if (user.passwordHash && (!values.currentPassword || !(await verifyPassword(values.currentPassword, user.passwordHash)))) {
            redirect("/settings?tab=account&edit=1&error=current-password");
        }

        data.passwordHash = await hashPassword(values.newPassword);
    }

    return data;
}

function pickUpdateData(tab: z.infer<typeof tabSchema>, values: z.infer<typeof settingsSchema>) {
    const data: Prisma.UserUpdateInput = {};

    if (tab === "profile") {
        data.name = values.name;
        data.bio = values.bio;
        data.image = values.image;
        data.background = values.background;
        data.profileColor = values.profileColor;
        data.accentColor = values.accentColor;
        data.socials = values.socials;
    }

    if (tab === "privacy") {
        data.privacy = values.privacy;
    }

    if (tab === "widgets") {
        data.widgets = values.widgets;
    }

    if (tab === "preferences") {
        data.preferences = values.preferences;
    }

    return data;
}

export async function updateUserSettings(tabValue: string, formData: FormData) {
    const tabResult = tabSchema.safeParse(tabValue);

    if (!tabResult.success) {
        redirect("/settings?error=invalid-tab");
    }

    const tab = tabResult.data;
    const userId = await getCurrentUserId();
    const parsedValues = settingsSchema.safeParse(Object.fromEntries(formData));

    if (!parsedValues.success) {
        redirect(`/settings?tab=${tab}&edit=1&error=invalid`);
    }

    const values = parsedValues.data;
    const data = tab === "account" ? await pickAccountUpdateData(userId, values) : pickUpdateData(tab, values);

    try {
        await db.user.update({
            where: { id: userId },
            data,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            redirect(`/settings?tab=${tab}&edit=1&error=duplicate`);
        }

        throw error;
    }

    revalidatePath("/settings");
    revalidatePath("/u/[user]", "page");
    redirect(`/settings?tab=${tab}&saved=1`);
}
