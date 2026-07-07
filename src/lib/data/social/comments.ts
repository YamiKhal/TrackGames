import db from "@/lib/db";
import { InteractionTargetType } from "@/lib/generated/prisma/enums";

export async function getComments(targetType: InteractionTargetType, targetId: string, userId?: string) {
	const comments = await db.comment.findMany({
		where: {
			targetType,
			targetId,
		},
		orderBy: {
			createdAt: "asc",
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					image: true,
					roles: true,
				},
			},
		},
	});

	const [likes, userLikes, ratings] = await Promise.all([
		db.like.groupBy({
			by: ["commentId"],
			where: {
				commentId: {
					in: comments.map((comment) => comment.id),
				},
			},
			_count: true,
		}),
		userId
			? db.like.findMany({
					where: {
						userId,
						commentId: {
							in: comments.map((comment) => comment.id),
						},
					},
					select: {
						commentId: true,
					},
				})
			: Promise.resolve([]),
		targetType === InteractionTargetType.GAME
			? db.userGameEntry.findMany({
					where: {
						gameId: Number(targetId),
						userId: {
							in: Array.from(new Set(comments.map((comment) => comment.userId))),
						},
					},
					select: {
						userId: true,
						rating: true,
					},
				})
			: Promise.resolve([]),
	]);

	return comments.map((comment) => ({
		...comment,
		likes: likes.find((like) => like.commentId === comment.id)?._count ?? 0,
		liked: userLikes.some((like) => like.commentId === comment.id),
		userRating: ratings.find((rating) => rating.userId === comment.userId)?.rating ?? null,
	}));
}
