"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import db from "@/lib/db";
import { RoadmapStatus } from "@/lib/generated/prisma/enums";
import { inputError, logger } from "@/lib/logger";
import { type ActionResult } from "@/lib/types";

const changelogSchema = z.object({
	title: z.string().trim().min(1, "Title is required.").max(200),
	slug: z.string().trim().max(200).optional(),
	version: z
		.string()
		.trim()
		.max(50)
		.optional()
		.transform((value) => value || null),
	summary: z
		.string()
		.trim()
		.max(2000)
		.optional()
		.transform((value) => value || null),
	pinned: z.boolean(),
	published: z.boolean(),
	publishedAt: z
		.string()
		.trim()
		.optional()
		.transform((value) => (value ? new Date(value) : new Date())),
});

const roadmapSchema = z.object({
	title: z.string().trim().min(1, "Title is required.").max(200),
	slug: z.string().trim().max(200).optional(),
	summary: z
		.string()
		.trim()
		.max(2000)
		.optional()
		.transform((value) => value || null),
	status: z.enum(RoadmapStatus),
	position: z.coerce.number().int().min(0).max(100000).catch(0),
	public: z.boolean(),
});

function slugify(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

// Content is Markdown text (same format as profile widgets). It is sanitized at
// render time by MarkdownBlocks (rehype-sanitize + allowedElements), so store as-is.
function readContent(formData: FormData) {
	return String(formData.get("content") ?? "").slice(0, 20000);
}

function changelogInput(formData: FormData) {
	return changelogSchema.safeParse({
		title: formData.get("title"),
		slug: formData.get("slug") ?? undefined,
		version: formData.get("version") ?? undefined,
		summary: formData.get("summary") ?? undefined,
		pinned: formData.get("pinned") === "on",
		published: formData.get("published") === "on",
		publishedAt: formData.get("publishedAt") ?? undefined,
	});
}

export async function createChangelog(formData: FormData): Promise<ActionResult | undefined> {
	await requireAdmin();
	const parsed = changelogInput(formData);
	if (!parsed.success) return inputError(parsed.error.issues[0]?.message ?? "Invalid entry.");

	const slug = parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.title);
	if (!slug) return inputError("Enter a title or slug.");
	if (await db.changelog.findUnique({ where: { slug }, select: { id: true } })) return inputError("That slug is already used.");

	try {
		await db.changelog.create({
			data: {
				slug,
				title: parsed.data.title,
				version: parsed.data.version,
				summary: parsed.data.summary,
				pinned: parsed.data.pinned,
				published: parsed.data.published,
				publishedAt: parsed.data.publishedAt,
				content: readContent(formData),
			},
		});
	} catch (error) {
		logger.error("admin", "Failed to create changelog", error);
		return inputError("Could not create entry.");
	}

	revalidatePath("/changelog");
	revalidatePath("/dashboard");
}

export async function updateChangelog(formData: FormData): Promise<ActionResult | undefined> {
	await requireAdmin();
	const id = String(formData.get("id") ?? "");
	if (!id) return inputError("Missing entry.");
	const parsed = changelogInput(formData);
	if (!parsed.success) return inputError(parsed.error.issues[0]?.message ?? "Invalid entry.");

	const slug = parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.title);
	if (!slug) return inputError("Enter a title or slug.");
	const clash = await db.changelog.findFirst({ where: { slug, NOT: { id } }, select: { id: true } });
	if (clash) return inputError("That slug is already used.");

	try {
		await db.changelog.update({
			where: { id },
			data: {
				slug,
				title: parsed.data.title,
				version: parsed.data.version,
				summary: parsed.data.summary,
				pinned: parsed.data.pinned,
				published: parsed.data.published,
				publishedAt: parsed.data.publishedAt,
				content: readContent(formData),
			},
		});
	} catch (error) {
		logger.error("admin", "Failed to update changelog", error);
		return inputError("Could not update entry.");
	}

	revalidatePath("/changelog");
	revalidatePath("/dashboard");
}

export async function deleteChangelog(formData: FormData): Promise<ActionResult | undefined> {
	await requireAdmin();
	const id = String(formData.get("id") ?? "");
	if (!id) return inputError("Missing entry.");
	await db.changelog.delete({ where: { id } });
	revalidatePath("/changelog");
	revalidatePath("/dashboard");
}

function roadmapInput(formData: FormData) {
	return roadmapSchema.safeParse({
		title: formData.get("title"),
		slug: formData.get("slug") ?? undefined,
		summary: formData.get("summary") ?? undefined,
		status: formData.get("status"),
		position: formData.get("position") ?? 0,
		public: formData.get("public") === "on",
	});
}

export async function createRoadmapItem(formData: FormData): Promise<ActionResult | undefined> {
	await requireAdmin();
	const parsed = roadmapInput(formData);
	if (!parsed.success) return inputError(parsed.error.issues[0]?.message ?? "Invalid item.");

	const slug = parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.title);
	if (!slug) return inputError("Enter a title or slug.");
	if (await db.roadmapItem.findUnique({ where: { slug }, select: { id: true } })) return inputError("That slug is already used.");

	try {
		await db.roadmapItem.create({
			data: {
				slug,
				title: parsed.data.title,
				summary: parsed.data.summary,
				status: parsed.data.status,
				position: parsed.data.position,
				public: parsed.data.public,
				content: readContent(formData),
			},
		});
	} catch (error) {
		logger.error("admin", "Failed to create roadmap item", error);
		return inputError("Could not create item.");
	}

	revalidatePath("/roadmap");
	revalidatePath("/dashboard");
}

export async function updateRoadmapItem(formData: FormData): Promise<ActionResult | undefined> {
	await requireAdmin();
	const id = String(formData.get("id") ?? "");
	if (!id) return inputError("Missing item.");
	const parsed = roadmapInput(formData);
	if (!parsed.success) return inputError(parsed.error.issues[0]?.message ?? "Invalid item.");

	const slug = parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.title);
	if (!slug) return inputError("Enter a title or slug.");
	const clash = await db.roadmapItem.findFirst({ where: { slug, NOT: { id } }, select: { id: true } });
	if (clash) return inputError("That slug is already used.");

	try {
		await db.roadmapItem.update({
			where: { id },
			data: {
				slug,
				title: parsed.data.title,
				summary: parsed.data.summary,
				status: parsed.data.status,
				position: parsed.data.position,
				public: parsed.data.public,
				content: readContent(formData),
			},
		});
	} catch (error) {
		logger.error("admin", "Failed to update roadmap item", error);
		return inputError("Could not update item.");
	}

	revalidatePath("/roadmap");
	revalidatePath("/dashboard");
}

export async function deleteRoadmapItem(formData: FormData): Promise<ActionResult | undefined> {
	await requireAdmin();
	const id = String(formData.get("id") ?? "");
	if (!id) return inputError("Missing item.");
	await db.roadmapItem.delete({ where: { id } });
	revalidatePath("/roadmap");
	revalidatePath("/dashboard");
}
