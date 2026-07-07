"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { inputError } from "@/lib/logger";

export async function toggleRoadmapVote(itemId: string) {
	const session = await auth();

	if (!session?.user?.id) {
		return inputError("You must be logged in to vote.");
	}

	const userId = session.user.id;

	const item = await db.roadmapItem.findFirst({ where: { id: itemId, public: true }, select: { id: true } });

	if (!item) {
		return inputError("Roadmap item not found.");
	}

	const existing = await db.roadmapVote.findUnique({
		where: { userId_itemId: { userId, itemId } },
		select: { id: true },
	});

	if (existing) {
		await db.roadmapVote.delete({ where: { id: existing.id } });
	} else {
		await db.roadmapVote.create({ data: { userId, itemId } });
	}

	const voteCount = await db.roadmapVote.count({ where: { itemId } });

	revalidatePath("/roadmap");

	return { voted: !existing, voteCount };
}
