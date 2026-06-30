import db from "../db";
import { ActivityType, InteractionTargetType, NotificationType } from "../generated/prisma/enums";

export async function awardBadge(userId: string, badge: { slug: string; name: string; description?: string; icon?: string; color?: string }) {
	const savedBadge = await db.badge.upsert({
		where: {
			slug: badge.slug,
		},
		update: {
			name: badge.name,
			description: badge.description ?? null,
			icon: badge.icon ?? null,
			color: badge.color ?? null,
		},
		create: {
			slug: badge.slug,
			name: badge.name,
			description: badge.description ?? null,
			icon: badge.icon ?? null,
			color: badge.color ?? null,
		},
		select: {
			id: true,
		},
	});

	const existing = await db.userBadge.findUnique({
		where: {
			userId_badgeId: {
				userId,
				badgeId: savedBadge.id,
			},
		},
	});

	if (existing) return existing;

	const userBadge = await db.userBadge.create({
		data: {
			userId,
			badgeId: savedBadge.id,
		},
	});

	await db.activity.create({
		data: {
			userId,
			type: ActivityType.EARNED_BADGE,
			targetType: InteractionTargetType.USER_PROFILE,
			targetId: userId,
			expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		},
	});

	await db.notification.create({
		data: {
			userId,
			type: NotificationType.EARNED_BADGE,
			targetType: InteractionTargetType.USER_PROFILE,
			targetId: userId,
			message: badge.name,
		},
	});

	return userBadge;
}
