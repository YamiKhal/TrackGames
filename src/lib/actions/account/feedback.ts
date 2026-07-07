"use server";

import * as z from "zod";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { FeedbackType } from "@/lib/generated/prisma/enums";
import { inputError, logger } from "@/lib/logger";
import { type ActionResult } from "@/lib/types";

const feedbackSchema = z.object({
	type: z.enum(FeedbackType),
	page: z
		.string()
		.trim()
		.max(500)
		.optional()
		.transform((value) => value || null),
	message: z.string().trim().min(3, "Please describe your feedback.").max(4000),
});

export async function submitFeedback(formData: FormData): Promise<ActionResult | undefined> {
	const session = await auth();

	const parsed = feedbackSchema.safeParse({
		type: formData.get("type"),
		page: formData.get("page") ?? undefined,
		message: formData.get("message"),
	});

	if (!parsed.success) {
		return inputError(parsed.error.issues[0]?.message ?? "Please check your feedback and try again.");
	}

	try {
		await db.feedback.create({
			data: {
				userId: session?.user?.id ?? null,
				type: parsed.data.type,
				page: parsed.data.page,
				message: parsed.data.message,
			},
		});
	} catch (error) {
		logger.error("feedback", "Failed to create feedback", error);
		return inputError("Something went wrong. Please try again.");
	}
}
