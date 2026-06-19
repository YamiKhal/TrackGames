"use server";

import { redirect } from "next/navigation";
import { canViewPrivacy } from "../account/user";
import { auth } from "../auth";
import db from "../db";
import { ActivityType, InteractionTargetType, LikeTargetType, NotificationType } from "../generated/prisma/enums";

async function getCurrentUserId() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    return session.user.id;
}

function activityExpiry() {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

function commentActivityType(targetType: InteractionTargetType, parentId: string | null) {
    if (parentId) return ActivityType.REPLIED_TO_COMMENT;
    if (targetType === InteractionTargetType.GAME) return ActivityType.COMMENTED_ON_GAME;
    if (targetType === InteractionTargetType.USER_PROFILE) return ActivityType.COMMENTED_ON_PROFILE;
    return ActivityType.COMMENTED_ON_GAME_LIST;
}

async function isFollowing(viewerId: string, ownerId: string) {
    if (viewerId === ownerId) return false;

    const follow = await db.userFollow.findUnique({
        where: {
            followerId_followingId: {
                followerId: viewerId,
                followingId: ownerId,
            },
        },
        select: {
            id: true,
        },
    });

    return Boolean(follow);
}

async function ensureCanInteractWithTarget(targetType: InteractionTargetType, targetId: string, viewerId: string, mode: "comment" | "view") {
    if (!Object.values(InteractionTargetType).includes(targetType)) {
        throw new Error("Invalid target.");
    }

    if (targetType === InteractionTargetType.GAME) {
        const gameId = Number(targetId);

        if (!Number.isInteger(gameId) || gameId <= 0) {
            throw new Error("Invalid game.");
        }

        const game = await db.game.findUnique({
            where: { id: gameId },
            select: { id: true },
        });

        if (!game) {
            throw new Error("Game not found.");
        }

        return;
    }

    if (targetType === InteractionTargetType.USER_PROFILE) {
        const user = await db.user.findUnique({
            where: { id: targetId },
            select: {
                id: true,
                privacy: true,
                commentsHidden: true,
            },
        });

        if (!user) {
            throw new Error("Profile not found.");
        }

        const isOwner = user.id === viewerId;
        const canView = canViewPrivacy(user.privacy, isOwner, await isFollowing(viewerId, user.id));

        if (!canView) {
            throw new Error("Profile is private.");
        }

        if (mode === "comment" && user.commentsHidden) {
            throw new Error("Comments are disabled.");
        }

        return;
    }

    const list = await db.gameList.findUnique({
        where: { id: targetId },
        select: {
            id: true,
            userId: true,
            privacy: true,
            commentsHidden: true,
        },
    });

    if (!list) {
        throw new Error("List not found.");
    }

    const isOwner = list.userId === viewerId;
    const canView = canViewPrivacy(list.privacy, isOwner, await isFollowing(viewerId, list.userId));

    if (!canView) {
        throw new Error("List is private.");
    }

    if (mode === "comment" && list.commentsHidden) {
        throw new Error("Comments are disabled.");
    }
}

export async function addComment(targetType: InteractionTargetType, targetId: string, parentId: string | null, formData: FormData) {
    const userId = await getCurrentUserId();
    const content = String(formData.get("content") ?? "").trim();

    if (!content) {
        throw new Error("Comment is required.");
    }

    if (content.length > 2000) {
        throw new Error("Comments must be 2000 characters or fewer.");
    }

    await ensureCanInteractWithTarget(targetType, targetId, userId, "comment");

    if (parentId) {
        await db.$transaction(async (tx) => {
            const parent = await tx.comment.findFirst({
                where: {
                    id: parentId,
                    targetType,
                    targetId,
                },
                select: {
                    id: true,
                    userId: true,
                },
            });

            if (!parent) {
                throw new Error("Comment not found.");
            }

            const comment = await tx.comment.create({
                data: {
                    userId,
                    targetType,
                    targetId,
                    parentId,
                    content,
                },
            });

            await tx.activity.create({
                data: {
                    userId,
                    type: ActivityType.REPLIED_TO_COMMENT,
                    targetType,
                    targetId,
                    commentId: comment.id,
                    expiresAt: activityExpiry(),
                },
            });

            if (parent.userId !== userId) {
                await tx.notification.create({
                    data: {
                        userId: parent.userId,
                        actorId: userId,
                        type: NotificationType.COMMENT_REPLY,
                        targetType,
                        targetId,
                        commentId: comment.id,
                    },
                });
            }
        });

        return;
    }

    await db.$transaction(async (tx) => {
        const comment = await tx.comment.create({
            data: {
                userId,
                targetType,
                targetId,
                content,
            },
        });

        await tx.activity.create({
            data: {
                userId,
                type: commentActivityType(targetType, null),
                targetType,
                targetId,
                commentId: comment.id,
                expiresAt: activityExpiry(),
            },
        });

        if (targetType === InteractionTargetType.USER_PROFILE && targetId !== userId) {
            await tx.notification.create({
                data: {
                    userId: targetId,
                    actorId: userId,
                    type: NotificationType.COMMENTED_ON_PROFILE,
                    targetType,
                    targetId,
                    commentId: comment.id,
                },
            });
        }
    });
}

export async function toggleLike(targetType: LikeTargetType, targetId: string) {
    const userId = await getCurrentUserId();

    if (!Object.values(LikeTargetType).includes(targetType)) {
        throw new Error("Invalid target.");
    }

    const existing = await db.like.findUnique({
        where: {
            userId_targetType_targetId: {
                userId,
                targetType,
                targetId,
            },
        },
        select: {
            id: true,
        },
    });

    if (existing) {
        await db.like.delete({
            where: {
                id: existing.id,
            },
        });

        return;
    }

    const likedComment = targetType === LikeTargetType.COMMENT
        ? await db.comment.findUnique({ where: { id: targetId }, select: { userId: true, targetType: true, targetId: true } })
        : null;
    const likedList = targetType === LikeTargetType.GAME_LIST
        ? await db.gameList.findUnique({ where: { id: targetId }, select: { userId: true } })
        : null;

    if (targetType === LikeTargetType.COMMENT) {
        if (!likedComment) {
            throw new Error("Comment not found.");
        }

        await ensureCanInteractWithTarget(likedComment.targetType, likedComment.targetId, userId, "comment");
    }

    if (targetType === LikeTargetType.GAME_LIST) {
        if (!likedList) {
            throw new Error("List not found.");
        }

        await ensureCanInteractWithTarget(InteractionTargetType.GAME_LIST, targetId, userId, "view");
    }

    await db.$transaction(async (tx) => {
        await tx.like.create({
            data: {
                userId,
                targetType,
                targetId,
            },
        });

        await tx.activity.create({
            data: {
                userId,
                type: targetType === LikeTargetType.COMMENT ? ActivityType.LIKED_COMMENT : ActivityType.LIKED_GAME_LIST,
                targetType: targetType === LikeTargetType.COMMENT ? null : InteractionTargetType.GAME_LIST,
                targetId,
                commentId: targetType === LikeTargetType.COMMENT ? targetId : null,
                expiresAt: activityExpiry(),
            },
        });

        const ownerId = likedComment?.userId ?? likedList?.userId;

        if (ownerId && ownerId !== userId) {
            await tx.notification.create({
                data: {
                    userId: ownerId,
                    actorId: userId,
                    type: NotificationType.RECEIVED_LIKE,
                    targetType: likedComment?.targetType ?? InteractionTargetType.GAME_LIST,
                    targetId: likedComment?.targetId ?? targetId,
                    commentId: targetType === LikeTargetType.COMMENT ? targetId : null,
                },
            });
        }
    });
}

export async function deleteComment(commentId: string) {
    const userId = await getCurrentUserId();
    const comment = await db.comment.findUnique({
        where: {
            id: commentId,
        },
        select: {
            id: true,
            userId: true,
        },
    });

    if (!comment || comment.userId !== userId) {
        throw new Error("Comment not found.");
    }

    await db.$transaction([
        db.like.deleteMany({
            where: {
                targetType: LikeTargetType.COMMENT,
                targetId: comment.id,
            },
        }),
        db.comment.delete({
            where: {
                id: comment.id,
            },
        }),
    ]);
}

export async function toggleFollow(userIdToFollow: string) {
    const userId = await getCurrentUserId();

    if (userId === userIdToFollow) {
        throw new Error("You cannot follow yourself.");
    }

    const userToFollow = await db.user.findUnique({
        where: { id: userIdToFollow },
        select: {
            id: true,
        },
    });

    if (!userToFollow) {
        throw new Error("Profile not found.");
    }

    const existing = await db.userFollow.findUnique({
        where: {
            followerId_followingId: {
                followerId: userId,
                followingId: userIdToFollow,
            },
        },
        select: {
            id: true,
        },
    });

    if (existing) {
        await db.userFollow.delete({
            where: {
                id: existing.id,
            },
        });

        return { following: false };
    }

    await db.$transaction(async (tx) => {
        await tx.userFollow.create({
            data: {
                followerId: userId,
                followingId: userIdToFollow,
            },
        });

        await tx.activity.create({
            data: {
                userId,
                type: ActivityType.FOLLOWED_USER,
                targetType: InteractionTargetType.USER_PROFILE,
                targetId: userIdToFollow,
                expiresAt: activityExpiry(),
            },
        });

        await tx.notification.create({
            data: {
                userId: userIdToFollow,
                actorId: userId,
                type: NotificationType.FOLLOWED_USER,
                targetType: InteractionTargetType.USER_PROFILE,
                targetId: userId,
            },
        });
    });

    return { following: true };
}

export async function markNotificationsRead() {
    const userId = await getCurrentUserId();

    await db.notification.updateMany({
        where: {
            userId,
            readAt: null,
        },
        data: {
            readAt: new Date(),
        },
    });
}
