import { cache } from "react";
import db from "@/lib/db";
import { type UserRole } from "@/lib/generated/prisma/enums";
import type { UserGetPayload } from "@/lib/generated/prisma/models/User";
import type { PublicUser } from "@/lib/types";

type SessionUserRef = {
	id?: string;
	email?: string | null;
	name?: string | null;
	image?: string | null;
};

export type SecuredUser = UserGetPayload<{ omit: { passwordHash: true } }>;

export async function getUser(sessionUser: SessionUserRef | undefined): Promise<SecuredUser | null> {
	if (!sessionUser) return null;

	return await db.user.findFirst({
		where: {
			OR: [
				sessionUser.id ? { id: sessionUser.id } : undefined,
				sessionUser.email ? { email: sessionUser.email } : undefined,
				sessionUser.name ? { name: sessionUser.name } : undefined,
			].filter(Boolean) as { id?: string; email?: string; name?: string }[],
		},
		omit: {
			passwordHash: true,
		},
	});
}

export async function hasUserPassword(email: string): Promise<boolean> {
	const user = await db.user.findFirst({
		where: {
			email,
		},
		select: {
			passwordHash: true,
		},
	});

	return user?.passwordHash != undefined;
}

export async function getUserProviders(userId: string) {
	return await db.account.findMany({
		where: {
			userId,
		},
		select: {
			provider: true,
		},
	});
}

export const getPublicUser = cache(async (name: string): Promise<PublicUser | null> => {
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
			privacy: true,
			libraryPrivacy: true,
			logsPrivacy: true,
			activityPrivacy: true,
			playlistPrivacy: true,
			socials: true,
			widgets: true,
			commentsHidden: true,
			hideCommentsEverywhere: true,
			roles: true,
			createdAt: true,
		},
	});

	return user as PublicUser;
});

export async function isFollower(sessionUserId: string | undefined, userId: string | undefined): Promise<boolean> {
	if (!sessionUserId || !userId) return false;
	if (sessionUserId === userId) return true;

	return !!(await db.userFollow.findUnique({
		where: {
			followerId_followingId: {
				followerId: sessionUserId,
				followingId: userId,
			},
		},
		select: {
			id: true,
		},
	}));
}

export async function userHasRole(userId: string, role: UserRole) {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { roles: true },
	});

	return Boolean(user?.roles.includes(role));
}

export async function userHasAnyRole(userId: string, roles: UserRole[]) {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { roles: true },
	});

	return Boolean(user?.roles.some((role) => roles.includes(role)));
}
