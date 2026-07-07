"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as z from "zod";
import { clearAccountData } from "@/lib/actions/account/settings";
import { deleteActivityForGameList } from "@/lib/actions/social/social";
import { ADMIN_REAUTH_COOKIE, ADMIN_REAUTH_TTL_MS, requireAdmin, requireAdminForGate, signReauth } from "@/lib/admin/guard";
import { usernameSchema } from "@/lib/constants";
import db from "@/lib/db";
import { FeedbackStatus, GameListType, ReportStatus, UserRole } from "@/lib/generated/prisma/enums";
import { inputError, logger } from "@/lib/logger";
import { type ActionResult } from "@/lib/types";
import { formDataString } from "@/lib/util/parse/formData";
import { verifyPassword } from "@/lib/util/server/password";

/** Gate action: verify the admin's password and mint a fresh reauth cookie. */
export async function confirmAdminPassword(formData: FormData): Promise<ActionResult | undefined> {
	const { admin } = await requireAdminForGate();
	const password = String(formData.get("password") ?? "");

	if (!password || !admin.passwordHash || !(await verifyPassword(password, admin.passwordHash))) {
		return inputError("Incorrect password.");
	}

	const expiresAt = Date.now() + ADMIN_REAUTH_TTL_MS;
	(await cookies()).set(ADMIN_REAUTH_COOKIE, signReauth(admin.id, expiresAt), {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		path: "/",
		maxAge: Math.floor(ADMIN_REAUTH_TTL_MS / 1000),
	});

	redirect("/dashboard");
}

export async function endAdminSession() {
	await requireAdminForGate();
	(await cookies()).delete(ADMIN_REAUTH_COOKIE);
	redirect("/dashboard/gate");
}

const reportStatusSchema = z.object({
	reportId: z.string().min(1),
	status: z.enum(ReportStatus),
	note: z
		.string()
		.trim()
		.max(2000)
		.optional()
		.transform((value) => value || null),
});

export async function setReportStatus(formData: FormData): Promise<ActionResult | undefined> {
	const admin = await requireAdmin();
	const parsed = reportStatusSchema.safeParse({
		reportId: formData.get("reportId"),
		status: formData.get("status"),
		note: formData.get("note") ?? undefined,
	});
	if (!parsed.success) return inputError("Invalid report update.");

	const { reportId, status, note } = parsed.data;
	await db.report.update({
		where: { id: reportId },
		data: {
			status,
			resolutionNote: note,
			handlerId: admin.id,
			resolvedAt: status === ReportStatus.RESOLVED ? new Date() : null,
		},
	});
}

const feedbackStatusSchema = z.object({
	feedbackId: z.string().min(1),
	status: z.enum(FeedbackStatus),
});

export async function setFeedbackStatus(formData: FormData): Promise<ActionResult | undefined> {
	await requireAdmin();
	const parsed = feedbackStatusSchema.safeParse({
		feedbackId: formData.get("feedbackId"),
		status: formData.get("status"),
	});
	if (!parsed.success) return inputError("Invalid feedback update.");

	await db.feedback.update({ where: { id: parsed.data.feedbackId }, data: { status: parsed.data.status } });
}

export async function deleteFeedback(formData: FormData): Promise<ActionResult | undefined> {
	await requireAdmin();
	const feedbackId = String(formData.get("feedbackId") ?? "");
	if (!feedbackId) return inputError("Missing feedback.");
	await db.feedback.delete({ where: { id: feedbackId } });
}

// One submit for the member manage panel: username, bio, and roles together.
export async function updateMember(formData: FormData): Promise<ActionResult | undefined> {
	const admin = await requireAdmin();
	const userId = String(formData.get("userId") ?? "");
	if (!userId) return inputError("Missing user.");

	const parsed = usernameSchema.safeParse(formData.get("username"));
	if (!parsed.success) return inputError("Enter a valid username (letters, numbers, _ or -).");

	const roles = formData.getAll("roles").filter((role): role is UserRole => (Object.values(UserRole) as string[]).includes(role as string));

	// An admin can't strip their own last ADMIN role and lock themselves out.
	if (userId === admin.id && !roles.includes(UserRole.ADMIN)) {
		return inputError("You can't remove your own admin role.");
	}

	const existing = await db.user.findFirst({ where: { name: parsed.data, NOT: { id: userId } }, select: { id: true } });
	if (existing) return inputError("That username is already taken.");

	const bio = formDataString(formData.get("bio")).trim();

	try {
		await db.user.update({ where: { id: userId }, data: { name: parsed.data, bio: bio ? bio.slice(0, 280) : null, roles } });
	} catch (error) {
		logger.error("admin", "Failed to update member", error);
		return inputError("Could not update member.");
	}
}

export async function wipeUserImages(formData: FormData): Promise<ActionResult | undefined> {
	await requireAdmin();
	const userId = String(formData.get("userId") ?? "");
	if (!userId) return inputError("Missing user.");
	await db.user.update({ where: { id: userId }, data: { image: null, background: null } });
}

export async function wipeUserWidgets(formData: FormData): Promise<ActionResult | undefined> {
	await requireAdmin();
	const userId = String(formData.get("userId") ?? "");
	if (!userId) return inputError("Missing user.");
	await db.user.update({ where: { id: userId }, data: { widgets: null } });
}

export async function deleteMemberAsAdmin(formData: FormData): Promise<ActionResult | undefined> {
	const admin = await requireAdmin();
	const userId = String(formData.get("userId") ?? "");
	if (!userId) return inputError("Missing user.");
	if (userId === admin.id) return inputError("You can't delete your own account here.");

	try {
		// Clears content that references the user by id/target string (comments on their lists,
		// notifications, activities) before the row-level cascade removes the user itself.
		await clearAccountData(userId);
		await db.user.delete({ where: { id: userId } });
	} catch (error) {
		logger.error("admin", "Failed to delete member", error);
		return inputError("Could not delete member.");
	}
}

export async function deleteCommentAsAdmin(formData: FormData): Promise<ActionResult | undefined> {
	await requireAdmin();
	const commentId = String(formData.get("commentId") ?? "");
	if (!commentId) return inputError("Missing comment.");

	try {
		// Deleting the root cascades to reply rows and every like (Comment.parent / Like.comment
		// are onDelete: Cascade), but activities/notifications only SetNull their commentId — so
		// gather the whole thread and clear those explicitly to avoid orphaned rows.
		const replies = await db.comment.findMany({ where: { parentId: commentId }, select: { id: true } });
		const ids = [commentId, ...replies.map((reply) => reply.id)];

		await db.$transaction([
			db.notification.deleteMany({ where: { commentId: { in: ids } } }),
			db.activity.deleteMany({ where: { commentId: { in: ids } } }),
			db.comment.delete({ where: { id: commentId } }),
		]);
	} catch (error) {
		logger.error("admin", "Failed to delete comment", error);
		return inputError("Could not delete comment.");
	}
}

export async function updateCommentAsAdmin(formData: FormData): Promise<ActionResult | undefined> {
	await requireAdmin();
	const commentId = String(formData.get("commentId") ?? "");
	const content = formDataString(formData.get("content")).trim();
	if (!commentId) return inputError("Missing comment.");
	if (!content) return inputError("Comment can't be empty.");
	if (content.length > 2000) return inputError("Comments must be 2000 characters or fewer.");

	try {
		await db.comment.update({ where: { id: commentId }, data: { content } });
	} catch (error) {
		logger.error("admin", "Failed to update comment", error);
		return inputError("Could not update comment.");
	}
}

export async function updatePlaylistAsAdmin(formData: FormData): Promise<ActionResult | undefined> {
	await requireAdmin();
	const listId = String(formData.get("listId") ?? "");
	const name = formDataString(formData.get("name")).trim();
	if (!listId) return inputError("Missing playlist.");
	if (!name) return inputError("Name is required.");

	const description = formDataString(formData.get("description")).trim();

	try {
		await db.gameList.update({
			where: { id: listId },
			data: {
				name: name.slice(0, 80),
				description: description ? description.slice(0, 500) : null,
				privacy: formDataString(formData.get("privacy")) === "private" ? "private" : "public",
				commentsHidden: formData.get("commentsHidden") === "on",
			},
		});
	} catch (error) {
		logger.error("admin", "Failed to update playlist", error);
		return inputError("Could not update playlist.");
	}
}

export async function deletePlaylistAsAdmin(formData: FormData): Promise<ActionResult | undefined> {
	await requireAdmin();
	const listId = String(formData.get("listId") ?? "");
	if (!listId) return inputError("Missing playlist.");

	try {
		// Entries and likes cascade with the list; comments/activities/notifications keyed by the
		// list's target string do not, so clear them first (mirrors deletePlaylist).
		await db.$transaction([...(await deleteActivityForGameList(db, listId)), db.gameList.deleteMany({ where: { id: listId, type: GameListType.PLAYLIST } })]);
	} catch (error) {
		logger.error("admin", "Failed to delete playlist", error);
		return inputError("Could not delete playlist.");
	}
}

// Moderation "manage by ID" loaders. Return null when nothing matches so the panel can show a
// not-found message rather than throwing.
export async function loadCommentForAdmin(commentId: string) {
	await requireAdmin();
	if (!commentId.trim()) return null;

	const comment = await db.comment.findUnique({
		where: { id: commentId.trim() },
		select: {
			id: true,
			content: true,
			createdAt: true,
			targetType: true,
			targetId: true,
			_count: { select: { likes: true, replies: true } },
			user: { select: { id: true, name: true, image: true, roles: true } },
		},
	});
	if (!comment) return null;

	return { ...comment, createdAt: comment.createdAt.toISOString() };
}

export async function loadPlaylistForAdmin(listId: string) {
	await requireAdmin();
	if (!listId.trim()) return null;

	const playlist = await db.gameList.findFirst({
		where: { id: listId.trim(), type: GameListType.PLAYLIST },
		select: {
			id: true,
			name: true,
			description: true,
			privacy: true,
			commentsHidden: true,
			createdAt: true,
			_count: { select: { entries: true, likes: true } },
			user: { select: { id: true, name: true, image: true } },
		},
	});
	if (!playlist) return null;

	return { ...playlist, createdAt: playlist.createdAt.toISOString() };
}
