"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { deleteActivityForGameList } from "@/lib/actions/social/social";
import { getCurrentUserId, signOut } from "@/lib/auth";
import { usernameSchema } from "@/lib/constants";
import db from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { ActivityType } from "@/lib/generated/prisma/enums";
import { inputError } from "@/lib/logger";
import { type ActionResult, LinkType } from "@/lib/types";
import { hashPassword, verifyPassword } from "@/lib/util/server/password";

type SocialLinkValue = {
	platform: z.infer<typeof socialPlatformSchema>;
	kind: z.infer<typeof socialKindSchema>;
	value: string;
};

const tabSchema = z.enum(["profile", "privacy", "widgets", "preferences", "account"]);
const socialPlatformSchema = z.enum(["x", "discord", "github", "twitch", "youtube", "instagram", "tiktok", "website"]);
const socialKindSchema = z.union([z.literal(LinkType.LINK), z.literal(LinkType.COPY)]);

const nullableText = (max: number) =>
	z
		.string()
		.trim()
		.max(max)
		.transform((value) => value || null);
const nullableUrl = z
	.string()
	.trim()
	.max(500)
	.transform((value, ctx) => {
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

const colorSchema = z
	.string()
	.trim()
	.transform((value, ctx) => {
		if (!value) return null;
		if (/^#[0-9a-f]{6}$/i.test(value)) return value;

		ctx.addIssue({ code: "custom", message: "Colors must use #RRGGBB format." });
		return z.NEVER;
	});
const checkboxSchema = z.union([z.literal("true"), z.literal("on"), z.literal("false")]).transform((value) => value === "true" || value === "on");

const socialLinksSchema = z
	.string()
	.trim()
	.max(5000)
	.transform((value, ctx) => {
		if (!value) return null;

		try {
			const parsed = JSON.parse(value);
			const socialLinks = z
				.array(
					z.object({
						platform: socialPlatformSchema,
						kind: socialKindSchema.default(LinkType.LINK),
						value: z.string().trim().max(500),
					}),
				)
				.max(20)
				.parse(parsed);
			const normalized: SocialLinkValue[] = [];

			for (const link of socialLinks) {
				const result = validateSocialLink(link);

				if (result && "error" in result) {
					ctx.addIssue({ code: "custom", message: result.error });
					return z.NEVER;
				}

				if (result) normalized.push(result);
			}

			return normalized.length > 0 ? JSON.stringify(normalized) : null;
		} catch {
			ctx.addIssue({ code: "custom", message: "Social links must be valid platform/link pairs." });
			return z.NEVER;
		}
	});

const settingsSchema = z.object({
	name: usernameSchema.optional(),
	bio: nullableText(280).optional(),
	image: nullableUrl.optional(),
	background: nullableUrl.optional(),
	profileColor: colorSchema.optional(),
	accentColor: colorSchema.optional(),
	privacy: z.enum(["public", "followers", "private"]).optional(),
	libraryPrivacy: z.enum(["public", "followers", "private"]).optional(),
	logsPrivacy: z.enum(["public", "followers", "private"]).optional(),
	activityPrivacy: z.enum(["public", "followers", "private"]).optional(),
	playlistPrivacy: z.enum(["public", "followers", "private"]).optional(),
	commentsHidden: checkboxSchema.optional(),
	hideCommentsEverywhere: checkboxSchema.optional(),
	defaultGameListStatus: z.enum(["all", "PLAYING", "COMPLETED", "BACKLOG", "PAUSED", "DROPPED", "WISHLIST"]).optional(),
	defaultGameListSort: z.enum(["added", "rating", "time", "name", "release", "notes"]).optional(),
	defaultGameListView: z.enum(["grid", "list"]).optional(),
	defaultActivityFilter: z.enum(["all", "logs", "games", "playlists", "comments", "social"]).optional(),
	siteThemeMode: z.enum(["default", "profile", "custom"]).optional(),
	siteThemeColor: colorSchema.optional(),
	siteAccentColor: colorSchema.optional(),
	notifyCommentReplies: checkboxSchema.optional(),
	notifyProfileComments: checkboxSchema.optional(),
	notifyLikes: checkboxSchema.optional(),
	notifyFollows: checkboxSchema.optional(),
	notifyFollowerLists: checkboxSchema.optional(),
	notifyBadges: checkboxSchema.optional(),
	socials: socialLinksSchema.optional(),
	preferences: nullableText(2000).optional(),
	widgets: nullableText(20000).optional(),
	email: z
		.union([z.email(), z.literal("")])
		.transform((value) => value || null)
		.optional(),
	currentPassword: z.string().max(128).optional(),
	newPassword: z.string().max(128).optional(),
	passwordConfirm: z.string().max(128).optional(),
});

function validateSocialLink(item: SocialLinkValue): SocialLinkValue | null | ActionResult {
	if (!item.value) return null;

	if (item.kind === LinkType.COPY) {
		if (item.value.length > 100) {
			return inputError("Copy values must be 100 characters or fewer.");
		}

		return { platform: item.platform, kind: item.kind, value: item.value };
	}

	const url = new URL(item.value);

	if (url.protocol !== "https:") {
		return inputError("Only HTTPS URLs are allowed.");
	}

	return { platform: item.platform, kind: item.kind, value: item.value };
}

async function getConfirmedUser(confirmName: string) {
	const userId = await getCurrentUserId();
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { id: true, name: true },
	});

	if (!user?.name || confirmName !== user.name) {
		return inputError("Username confirmation did not match.");
	}

	return user;
}

export async function clearAccountData(userId: string) {
	const lists = await db.gameList.findMany({ where: { userId }, select: { id: true } });
	const listCleanup = await Promise.all(lists.map((list) => deleteActivityForGameList(db, list.id)));

	await db.$transaction([
		db.notification.deleteMany({
			where: {
				OR: [{ userId }, { actorId: userId }],
			},
		}),
		db.userFollow.deleteMany({
			where: {
				OR: [{ followerId: userId }, { followingId: userId }],
			},
		}),
		db.userBadge.deleteMany({ where: { userId } }),
		db.like.deleteMany({ where: { userId } }),
		db.activity.deleteMany({ where: { userId } }),
		db.comment.deleteMany({ where: { userId } }),
		...listCleanup.flat(),
		db.gameList.deleteMany({ where: { userId } }),
		db.userGameEntry.deleteMany({ where: { userId } }),
	]);
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
		const finalEmail = values.email === undefined ? user.email : values.email;

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

async function ensureProfileNameAvailable(userId: string, values: z.infer<typeof settingsSchema>) {
	if (values.name === undefined) return;

	const existing = await db.user.findFirst({
		where: {
			name: values.name,
			NOT: { id: userId },
		},
		select: { id: true },
	});

	if (existing) {
		redirect("/settings?tab=profile&edit=1&error=duplicate");
	}
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
		data.libraryPrivacy = values.libraryPrivacy;
		data.activityPrivacy = values.activityPrivacy;
		data.playlistPrivacy = values.playlistPrivacy;
		data.commentsHidden = values.commentsHidden ?? false;
	}

	if (tab === "widgets") {
		data.widgets = values.widgets;
	}

	if (tab === "preferences") {
		data.defaultGameListStatus = values.defaultGameListStatus;
		data.defaultGameListSort = values.defaultGameListSort;
		data.defaultGameListView = values.defaultGameListView;
		data.defaultActivityFilter = values.defaultActivityFilter;
		data.siteThemeMode = values.siteThemeMode;
		data.siteThemeColor = values.siteThemeMode === "custom" ? values.siteThemeColor : null;
		data.siteAccentColor = values.siteThemeMode === "custom" ? values.siteAccentColor : null;
		data.hideCommentsEverywhere = values.hideCommentsEverywhere ?? false;
		data.notifyCommentReplies = values.notifyCommentReplies ?? false;
		data.notifyProfileComments = values.notifyProfileComments ?? false;
		data.notifyLikes = values.notifyLikes ?? false;
		data.notifyFollows = values.notifyFollows ?? false;
		data.notifyFollowerLists = values.notifyFollowerLists ?? false;
		data.notifyBadges = values.notifyBadges ?? false;
	}

	return data;
}

export async function updateUserSettings(tabValue: string, formData: FormData) {
	const tabResult = tabSchema.safeParse(tabValue);

	if (!tabResult.success) {
		return inputError("Invalid tab. Refresh the page or report to an admin.");
	}

	const tab = tabResult.data;
	const userId = await getCurrentUserId();
	const parsedValues = settingsSchema.safeParse(Object.fromEntries(formData));

	if (tab === "profile" && !usernameSchema.safeParse(formData.get("name")).success) {
		return inputError("Invalid username. Check the fields and try again.");
	}

	if (!parsedValues.success) {
		return inputError("Some settings were invalid. Check the fields and try again.");
	}

	const values = parsedValues.data;

	if (tab === "profile") {
		await ensureProfileNameAvailable(userId, values);
	}

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

	revalidatePath("/", "layout");
	revalidatePath("/settings");
	revalidatePath("/u/[user]", "page");
}

export async function clearUserLibrary(confirmName: string) {
	const user = await getConfirmedUser(confirmName);

	if ("error" in user) {
		return user;
	}

	await db.$transaction([
		db.activity.deleteMany({
			where: {
				userId: user.id,
				type: {
					in: [ActivityType.ADDED_GAME_TO_LIBRARY, ActivityType.RATED_GAME, ActivityType.LOGGED_GAME_PLAY],
				},
			},
		}),
		db.userGameEntry.deleteMany({
			where: { userId: user.id },
		}),
	]);

	revalidatePath("/", "layout");
	revalidatePath("/settings");
	revalidatePath("/library/[slug]", "page");
}

export async function resetUserAccountData(confirmName: string) {
	const user = await getConfirmedUser(confirmName);

	if ("error" in user) {
		return user;
	}

	await clearAccountData(user.id);
	await db.user.update({
		where: { id: user.id },
		data: {
			bio: null,
			image: null,
			background: null,
			profileColor: null,
			accentColor: null,
			privacy: "public",
			libraryPrivacy: "public",
			logsPrivacy: "public",
			activityPrivacy: "public",
			playlistPrivacy: "public",
			socials: null,
			preferences: null,
			widgets: null,
			commentsHidden: false,
			hideCommentsEverywhere: false,
			defaultGameListStatus: "all",
			defaultGameListSort: "added",
			defaultGameListView: "grid",
			defaultActivityFilter: "all",
			siteThemeMode: "default",
			siteThemeColor: null,
			siteAccentColor: null,
			notifyCommentReplies: true,
			notifyProfileComments: true,
			notifyLikes: true,
			notifyFollows: true,
			notifyFollowerLists: true,
			notifyBadges: true,
		},
	});

	revalidatePath("/", "layout");
	revalidatePath("/settings");
	revalidatePath("/u/[user]", "page");
	revalidatePath("/library/[slug]", "page");
}

export async function deleteUserAccount(confirmName: string) {
	const user = await getConfirmedUser(confirmName);

	if ("error" in user) {
		return user;
	}

	await db.notification.deleteMany({
		where: {
			actorId: user.id,
		},
	});
	await db.user.delete({
		where: { id: user.id },
	});

	await signOut({ redirectTo: "/" });
}
