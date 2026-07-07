"use server";

import * as z from "zod";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { ReportReason, ReportTargetType } from "@/lib/generated/prisma/enums";
import { inputError, logger } from "@/lib/logger";
import { type ActionResult } from "@/lib/types";

const reportSchema = z.object({
	targetType: z.enum(ReportTargetType),
	targetId: z.string().min(1).max(200),
	reportedUserId: z
		.string()
		.max(200)
		.optional()
		.transform((value) => value || null),
	reason: z.enum(ReportReason),
	details: z
		.string()
		.trim()
		.max(2000)
		.optional()
		.transform((value) => value || null),
	url: z
		.string()
		.trim()
		.max(1000)
		.optional()
		.transform((value) => value || null),
	context: z
		.string()
		.max(4000)
		.optional()
		.transform((value) => {
			if (!value) return {};
			try {
				const parsed = JSON.parse(value);
				return parsed && typeof parsed === "object" ? parsed : {};
			} catch {
				return {};
			}
		}),
});

export async function submitReport(formData: FormData): Promise<ActionResult | undefined> {
	const session = await auth();

	if (!session?.user?.id) {
		return inputError("You must be logged in to report content.");
	}

	const parsed = reportSchema.safeParse({
		targetType: formData.get("targetType"),
		targetId: formData.get("targetId"),
		reportedUserId: formData.get("reportedUserId") ?? undefined,
		reason: formData.get("reason"),
		details: formData.get("details") ?? undefined,
		url: formData.get("url") ?? undefined,
		context: formData.get("context") ?? undefined,
	});

	if (!parsed.success) {
		return inputError("Please choose a reason and try again.");
	}

	const { targetType, targetId, reportedUserId, reason, details, url, context } = parsed.data;

	// Don't let a user report their own content.
	if (reportedUserId && reportedUserId === session.user.id) {
		return inputError("You can't report your own content.");
	}

	// Anti-spam: cap open reports from the same user against the same target.
	const openReports = await db.report.count({
		where: {
			reporterId: session.user.id,
			targetType,
			targetId,
			status: { not: "RESOLVED" },
		},
	});

	if (openReports >= 3) {
		return inputError("You already have reports pending on this content.");
	}

	try {
		await db.report.create({
			data: {
				reporterId: session.user.id,
				targetType,
				targetId,
				reportedUserId,
				reason,
				details,
				url,
				context,
			},
		});
	} catch (error) {
		logger.error("report", "Failed to create report", error);
		return inputError("Something went wrong. Please try again.");
	}
}
