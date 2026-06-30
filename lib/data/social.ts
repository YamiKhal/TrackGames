import db from "../db";
import { ActivityType, InteractionTargetType, LikeTargetType, NotificationType } from "../generated/prisma/enums";
import { notificationAllowed } from "../account/preferences";

export const activityPageSize = 32;

export async function getPlaylistLikeState(listId: string, userId?: string) {
	const [likes, userLike] = await Promise.all([
		db.like.count({
			where: {
				targetType: LikeTargetType.GAME_LIST,
				targetId: listId,
			},
		}),
		userId
			? db.like.findUnique({
					where: {
						userId_targetType_targetId: {
							userId,
							targetType: LikeTargetType.GAME_LIST,
							targetId: listId,
						},
					},
					select: {
						id: true,
					},
				})
			: null,
	]);

	return {
		likes,
		liked: Boolean(userLike),
	};
}

export async function getProfileSocialState(profileId: string, viewerId?: string) {
	const [following, followers, followingCount, followerCount, viewerFollow] = await Promise.all([
		db.userFollow.findMany({
			where: {
				followerId: profileId,
			},
			take: 16,
			orderBy: {
				createdAt: "desc",
			},
			select: {
				following: {
					select: {
						name: true,
						image: true,
					},
				},
			},
		}),
		db.userFollow.findMany({
			where: {
				followingId: profileId,
			},
			take: 16,
			orderBy: {
				createdAt: "desc",
			},
			select: {
				follower: {
					select: {
						name: true,
						image: true,
					},
				},
			},
		}),
		db.userFollow.count({
			where: {
				followerId: profileId,
			},
		}),
		db.userFollow.count({
			where: {
				followingId: profileId,
			},
		}),
		viewerId
			? db.userFollow.findUnique({
					where: {
						followerId_followingId: {
							followerId: viewerId,
							followingId: profileId,
						},
					},
					select: {
						id: true,
					},
				})
			: null,
	]);

	return {
		following: following.flatMap((follow) => (follow.following.name ? [{ name: follow.following.name, image: follow.following.image }] : [])),
		followers: followers.flatMap((follow) => (follow.follower.name ? [{ name: follow.follower.name, image: follow.follower.image }] : [])),
		followingCount,
		followerCount,
		isFollowing: Boolean(viewerFollow),
	};
}

export async function getUserActivities(userId: string, page: number, filter = "all", canViewLogs = true) {
	const safePage = Math.max(1, Math.floor(page));
	const typeGroups: Record<string, ActivityType[]> = {
		logs: [ActivityType.LOGGED_GAME_PLAY],
		games: [ActivityType.ADDED_GAME_TO_LIBRARY, ActivityType.RATED_GAME],
		playlists: [ActivityType.CREATED_PLAYLIST, ActivityType.ADDED_GAME_TO_PLAYLIST, ActivityType.LIKED_GAME_LIST, ActivityType.COMMENTED_ON_GAME_LIST],
		comments: [
			ActivityType.COMMENTED_ON_GAME_LIST,
			ActivityType.COMMENTED_ON_PROFILE,
			ActivityType.COMMENTED_ON_GAME,
			ActivityType.REPLIED_TO_COMMENT,
			ActivityType.LIKED_COMMENT,
		],
		social: [ActivityType.FOLLOWED_USER, ActivityType.EARNED_BADGE],
	};
	const types = filter === "logs" && !canViewLogs ? [] : typeGroups[filter];
	const notViewingLogs = canViewLogs ? {} : { type: { not: ActivityType.LOGGED_GAME_PLAY } };
	const where = {
		userId,
		expiresAt: {
			gt: new Date(),
		},
		...(types ? { type: { in: types } } : notViewingLogs),
	};
	const [activities, count] = await Promise.all([
		db.activity.findMany({
			where,
			take: activityPageSize,
			skip: (safePage - 1) * activityPageSize,
			orderBy: {
				createdAt: "desc",
			},
			include: {
				game: {
					select: {
						slug: true,
						name: true,
					},
				},
				comment: {
					select: {
						targetType: true,
						targetId: true,
					},
				},
			},
		}),
		db.activity.count({
			where,
		}),
	]);
	const targets = activities.map((activity) => ({
		type: activity.comment?.targetType ?? activity.targetType,
		id: activity.comment?.targetId ?? activity.targetId,
	}));
	const listIds = targets.flatMap((target) => (target.type === InteractionTargetType.GAME_LIST && target.id ? [target.id] : []));
	const userIds = targets.flatMap((target) => (target.type === InteractionTargetType.USER_PROFILE && target.id ? [target.id] : []));
	const gameIds = targets.flatMap((target) => (target.type === InteractionTargetType.GAME && target.id ? [Number(target.id)] : [])).filter(Number.isInteger);
	const [lists, users, games] = await Promise.all([
		listIds.length
			? db.gameList.findMany({
					where: {
						id: {
							in: listIds,
						},
					},
					select: {
						id: true,
						name: true,
					},
				})
			: [],
		userIds.length
			? db.user.findMany({
					where: {
						id: {
							in: userIds,
						},
					},
					select: {
						id: true,
						name: true,
					},
				})
			: [],
		gameIds.length
			? db.game.findMany({
					where: {
						id: {
							in: gameIds,
						},
					},
					select: {
						id: true,
						slug: true,
						name: true,
					},
				})
			: [],
	]);

	return {
		activities: activities.map((activity) => {
			const targetType = activity.comment?.targetType ?? activity.targetType;
			const targetId = activity.comment?.targetId ?? activity.targetId;
			const list = lists.find((item) => item.id === targetId);
			const user = users.find((item) => item.id === targetId);
			const game = games.find((item) => item.id === Number(targetId)) ?? activity.game;
			const isCommentActivity = Boolean(activity.comment);
			const targetSlugHref = game?.slug ? `/game/${game.slug}` : null;
			const targetNameHref = user?.name ? `/u/${user.name}` : targetSlugHref;
			const targetHref = list ? `/playlist/${list.id}` : targetNameHref;

			return {
				...activity,
				targetType,
				targetName: list?.name ?? user?.name ?? game?.name ?? null,
				targetHref: targetHref && isCommentActivity ? `${targetHref}#comments` : targetHref,
			};
		}),
		page: safePage,
		totalPages: Math.max(1, Math.ceil(count / activityPageSize)),
	};
}

export async function getUserGamePlayLogs(userId: string) {
	return await db.userGamePlayLog.findMany({
		where: {
			userId,
		},
		take: 24,
		orderBy: {
			playedAt: "desc",
		},
		include: {
			game: {
				select: {
					slug: true,
					name: true,
					cover: true,
				},
			},
		},
	});
}

export async function getUserBadges(userId: string) {
	return await db.userBadge.findMany({
		where: {
			userId,
		},
		orderBy: {
			earnedAt: "desc",
		},
		include: {
			badge: true,
		},
	});
}

export async function getUserNotifications(userId: string) {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: {
			notifyCommentReplies: true,
			notifyProfileComments: true,
			notifyLikes: true,
			notifyFollows: true,
			notifyFollowerLists: true,
			notifyBadges: true,
		},
	});
	const notifications = (
		await db.notification.findMany({
			where: {
				userId,
			},
			take: 30,
			orderBy: {
				createdAt: "desc",
			},
			include: {
				actor: {
					select: {
						name: true,
						image: true,
					},
				},
			},
		})
	)
		.filter((notification) => !user || notificationAllowed(user, notification.type))
		.slice(0, 10);
	const profileIds = notifications.flatMap((notification) =>
		notification.targetType === InteractionTargetType.USER_PROFILE && notification.targetId ? [notification.targetId] : [],
	);
	const gameIds = notifications
		.flatMap((notification) => (notification.targetType === InteractionTargetType.GAME && notification.targetId ? [Number(notification.targetId)] : []))
		.filter(Number.isInteger);
	const [profiles, games] = await Promise.all([
		profileIds.length
			? db.user.findMany({
					where: {
						id: {
							in: profileIds,
						},
					},
					select: {
						id: true,
						name: true,
					},
				})
			: [],
		gameIds.length
			? db.game.findMany({
					where: {
						id: {
							in: gameIds,
						},
					},
					select: {
						id: true,
						slug: true,
					},
				})
			: [],
	]);

	return notifications.map((notification) => {
		const profile = profiles.find((item) => item.id === notification.targetId);
		const game = games.find((item) => item.id === Number(notification.targetId));
		const commentAnchor = notification.type === NotificationType.COMMENT_REPLY || notification.type === NotificationType.COMMENTED_ON_PROFILE || notification.commentId;

		let targetHref = "#";

		if (notification.targetType === InteractionTargetType.GAME_LIST && notification.targetId) {
			targetHref = `/playlist/${notification.targetId}${commentAnchor ? "#comments" : ""}`;
		}

		if (notification.targetType === InteractionTargetType.USER_PROFILE && profile?.name) {
			targetHref = `/u/${profile.name}${commentAnchor ? "#comments" : ""}`;
		}

		if (notification.targetType === InteractionTargetType.GAME && game?.slug) {
			targetHref = `/game/${game.slug}${commentAnchor ? "#comments" : ""}`;
		}

		return {
			...notification,
			targetHref,
		};
	});
}
