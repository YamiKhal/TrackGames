"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { getTagsForEntries, getUserGameEntryWithTags, replaceEntryTags } from "@/lib/data/gamelist/library";
import db from "@/lib/db";
import { ActivityType, GameStatus, InteractionTargetType } from "@/lib/generated/prisma/enums";
import { inputError, logger } from "@/lib/logger";
import type { ActionResult } from "@/lib/types";
import { ratingToHundred } from "@/lib/util/format/rating";
import { formDataString } from "@/lib/util/parse/formData";

const DEFAULT_LOG_NOTE = "No note.";

function pastDateFromInput(value: string, label: string): Date | null | ActionResult {
	if (!value) return null;

	const date = new Date(`${value}T12:00:00`);

	if (Number.isNaN(date.getTime())) {
		return inputError(`Invalid ${label} date.`);
	}

	const today = new Date();
	today.setHours(23, 59, 59, 999);

	if (date > today) {
		return inputError(`${label} date cannot be in the future.`);
	}

	return date;
}

function optionalNonNegativeNumber(value: string) {
	return value ? Math.max(0, Number(value)) : null;
}

export async function addGameToLibrary(gameId: number, gameSlug: string) {
	const userId = await getCurrentUserId();

	const entry = await db.userGameEntry.upsert({
		where: {
			userId_gameId: {
				userId,
				gameId,
			},
		},
		update: {},
		create: {
			userId,
			gameId,
		},
		include: {
			game: true,
			logs: {
				orderBy: {
					playedAt: "desc",
				},
			},
		},
	});
	const tags = await getTagsForEntries([entry.id]);

	revalidatePath(`/game/${gameSlug}`);
	return { ...entry, tags: tags.get(entry.id) ?? [] };
}

export async function removeGameFromLibrary(gameId: number, gameSlug: string) {
	const userId = await getCurrentUserId();

	await db.userGameEntry.deleteMany({
		where: {
			userId,
			gameId,
		},
	});

	revalidatePath(`/game/${gameSlug}`);
	return { inLibrary: false };
}

export async function setGameLibraryStatus(gameId: number, gameSlug: string, status: GameStatus) {
	const userId = await getCurrentUserId();

	if (!Object.values(GameStatus).includes(status)) {
		return inputError("Invalid game status.");
	}

	const current = await db.userGameEntry.findUnique({
		where: {
			userId_gameId: {
				userId,
				gameId,
			},
		},
		select: {
			timePlayed: true,
			timeFinished: true,
			finishedAt: true,
		},
	});

	const entry = await db.userGameEntry.upsert({
		where: {
			userId_gameId: {
				userId,
				gameId,
			},
		},
		update: {
			status,
			timeFinished: status === GameStatus.COMPLETED ? (current?.timeFinished ?? current?.timePlayed ?? null) : undefined,
			finishedAt: status === GameStatus.COMPLETED ? (current?.finishedAt ?? new Date()) : undefined,
		},
		create: {
			userId,
			gameId,
			status,
			finishedAt: status === GameStatus.COMPLETED ? new Date() : undefined,
		},
		include: {
			game: true,
			logs: {
				orderBy: {
					playedAt: "desc",
				},
			},
		},
	});
	const tags = await getTagsForEntries([entry.id]);

	revalidatePath(`/game/${gameSlug}`);
	return { ...entry, tags: tags.get(entry.id) ?? [] };
}

export async function updateGameQuickRating(gameId: number, gameSlug: string, value: number) {
	const userId = await getCurrentUserId();
	const rating = ratingToHundred(value) ?? null;

	const entry = await db.userGameEntry.upsert({
		where: {
			userId_gameId: {
				userId,
				gameId,
			},
		},
		update: {
			rating,
		},
		create: {
			userId,
			gameId,
			rating,
		},
		include: {
			game: true,
			logs: {
				orderBy: {
					playedAt: "desc",
				},
			},
		},
	});
	const tags = await getTagsForEntries([entry.id]);

	revalidatePath(`/game/${gameSlug}`);
	return { ...entry, tags: tags.get(entry.id) ?? [] };
}

export async function fetchUserGameEntry(gameId: number) {
	const userId = await getCurrentUserId();
	return await getUserGameEntryWithTags(userId, gameId);
}

export async function updateUserGameEntry(entryId: string, formData: FormData) {
	const userId = await getCurrentUserId();
	const status = formDataString(formData.get("status"));
	const ratingValue = formDataString(formData.get("rating")).trim();
	const timePlayedValue = formDataString(formData.get("timeplayed")).trim();
	const timeFinishedValue = formDataString(formData.get("timefinished")).trim();
	const timeMasteredValue = formDataString(formData.get("timemastered")).trim();
	const finishedAtValue = formDataString(formData.get("finishedat")).trim();
	const masteredAtValue = formDataString(formData.get("masteredat")).trim();
	const timeMode = formDataString(formData.get("timemode"), "manual") === "logs" ? "logs" : "manual";
	const notesValue = formDataString(formData.get("notes")).trim();
	const finished = formData.get("finished") === "on";
	const mastered = formData.get("mastered") === "on";
	const updateTags = formData.get("tagsTouched") === "1";
	const tagNames = Array.from(
		new Set(
			formData
				.getAll("tags")
				.map((tag) => formDataString(tag).trim())
				.filter(Boolean)
				.map((tag) => tag.slice(0, 40)),
		),
	);

	if (!Object.values(GameStatus).includes(status as GameStatus)) {
		return inputError("Invalid game status.");
	}

	const rating = ratingValue ? (ratingToHundred(Number(ratingValue)) ?? null) : null;
	const manualTime = optionalNonNegativeNumber(timePlayedValue);
	const finishedTime = optionalNonNegativeNumber(timeFinishedValue);
	const masteredTime = optionalNonNegativeNumber(timeMasteredValue);
	const safeFinishedTime = Number.isFinite(finishedTime) ? finishedTime : null;
	const safeMasteredTime = Number.isFinite(masteredTime) ? masteredTime : null;
	const finishedAt = pastDateFromInput(finishedAtValue, "Finished");
	if (finishedAt && "error" in finishedAt) return finishedAt;

	const masteredAt = pastDateFromInput(masteredAtValue, "Mastered");
	if (masteredAt && "error" in masteredAt) return masteredAt;

	const current = await db.userGameEntry.findUnique({
		where: {
			id: entryId,
			userId,
		},
		select: {
			gameId: true,
			timeFinished: true,
			timeMastered: true,
			finishedAt: true,
			masteredAt: true,
			logs: {
				select: {
					hours: true,
				},
			},
		},
	});

	if (!current) {
		return inputError("Library entry not found.");
	}

	const logTime = current.logs.reduce((total, log) => total + log.hours, 0);
	const timePlayed = timeMode === "logs" ? logTime : manualTime;
	const hasTimePlayed = Number.isFinite(timePlayed) && timePlayed != null && timePlayed > 0;
	const hasMasteredTime = Number.isFinite(masteredTime) && masteredTime != null && masteredTime > 0;

	if (mastered && !hasTimePlayed && !hasMasteredTime) {
		return inputError("Time played or mastered time is required before marking a game as mastered.");
	}

	const entry = await db.$transaction(async (tx) => {
		const updated = await tx.userGameEntry.update({
			where: {
				id: entryId,
				userId,
			},
			data: {
				status: status as GameStatus,
				rating: Number.isFinite(rating) ? rating : null,
				timeMode,
				timePlayed: hasTimePlayed ? timePlayed : null,
				timeFinished: finished ? (safeFinishedTime ?? current.timeFinished ?? timePlayed) : null,
				timeMastered: mastered ? (safeMasteredTime ?? current.timeMastered ?? timePlayed) : null,
				finishedAt: finished ? (finishedAt ?? current.finishedAt ?? new Date()) : null,
				masteredAt: mastered ? (masteredAt ?? current.masteredAt ?? new Date()) : null,
				notes: notesValue || null,
			},
			include: {
				game: true,
				logs: {
					orderBy: {
						createdAt: "desc",
					},
				},
			},
		});

		if (updateTags) {
			await replaceEntryTags(tx, userId, entryId, tagNames);
		}

		return updated;
	});
	const tags = await getTagsForEntries([entry.id]);

	revalidatePath("/library/[slug]", "page");
	return {
		...entry,
		tags: tags.get(entry.id) ?? [],
	};
}

export async function createUserGamePlayLog(entryId: string, formData: FormData) {
	const userId = await getCurrentUserId();
	const playedAtValue = formDataString(formData.get("playedat")).trim();
	const hours = Math.max(0, Number(formDataString(formData.get("hours")).trim()));
	const note = formDataString(formData.get("note")).trim() || DEFAULT_LOG_NOTE;
	const skipRecap = formData.get("skipRecap") === "on";
	const finished = formData.get("finished") === "on";
	const mastered = formData.get("mastered") === "on";

	if (!Number.isFinite(hours) || hours <= 0) {
		return inputError("Hours played must be greater than zero.");
	}

	const playedAt = playedAtValue ? new Date(`${playedAtValue}T12:00:00`) : new Date();

	if (Number.isNaN(playedAt.getTime())) {
		return inputError("Invalid played date.");
	}

	const current = await db.userGameEntry.findUnique({
		where: {
			id: entryId,
			userId,
		},
		select: {
			id: true,
			gameId: true,
			timeMode: true,
			timePlayed: true,
			timeFinished: true,
			timeMastered: true,
			finishedAt: true,
			masteredAt: true,
		},
	});

	if (!current) {
		return inputError("Library entry not found.");
	}

	const entry = await db.$transaction(async (tx) => {
		await tx.userGamePlayLog.create({
			data: {
				userId,
				entryId,
				gameId: current.gameId,
				hours,
				note,
				skipRecap,
				playedAt,
			},
		});

		const loggedTime = await tx.userGamePlayLog.aggregate({
			where: {
				entryId,
			},
			_sum: {
				hours: true,
			},
		});
		const totalTime = loggedTime._sum.hours ?? 0;
		const timePlayed = current.timeMode === "logs" ? totalTime : current.timePlayed;

		const updatedEntry = await tx.userGameEntry.update({
			where: {
				id: entryId,
				userId,
			},
			data: {
				timePlayed,
				status: finished || mastered ? GameStatus.COMPLETED : undefined,
				timeFinished: finished ? (current.timeFinished ?? timePlayed ?? hours) : undefined,
				timeMastered: mastered ? (current.timeMastered ?? timePlayed ?? hours) : undefined,
				finishedAt: finished ? (current.finishedAt ?? playedAt) : undefined,
				masteredAt: mastered ? (current.masteredAt ?? playedAt) : undefined,
			},
			include: {
				game: true,
				logs: {
					orderBy: {
						createdAt: "desc",
					},
				},
			},
		});

		await tx.activity.create({
			data: {
				userId,
				type: ActivityType.LOGGED_GAME_PLAY,
				targetType: InteractionTargetType.GAME,
				targetId: String(current.gameId),
				gameId: current.gameId,
				message: note,
			},
		});

		return updatedEntry;
	});
	const tags = await getTagsForEntries([entry.id]);

	revalidatePath("/library/[slug]", "page");
	revalidatePath("/u/[user]", "page");
	return {
		...entry,
		tags: tags.get(entry.id) ?? [],
	};
}

export async function updateUserGamePlayLog(logId: string, formData: FormData) {
	const userId = await getCurrentUserId();
	const playedAtValue = formDataString(formData.get("playedat")).trim();
	const hours = Math.max(0, Number(formDataString(formData.get("hours")).trim()));
	const note = formDataString(formData.get("note")).trim() || DEFAULT_LOG_NOTE;
	const skipRecap = formData.get("skipRecap") === "on";

	if (!Number.isFinite(hours) || hours <= 0) {
		return inputError("Hours played must be greater than zero.");
	}

	const playedAt = playedAtValue ? new Date(`${playedAtValue}T12:00:00`) : new Date();

	if (Number.isNaN(playedAt.getTime())) {
		return inputError("Invalid played date.");
	}

	let entry;

	try {
		entry = await db.$transaction(async (tx) => {
			const log = await tx.userGamePlayLog.update({
				where: {
					id: logId,
					userId,
				},
				data: {
					playedAt,
					hours,
					note,
					skipRecap,
				},
				select: {
					entryId: true,
				},
			});

			const current = await tx.userGameEntry.findUnique({
				where: {
					id: log.entryId,
					userId,
				},
				select: {
					timeMode: true,
				},
			});

			if (!current) {
				throw new Error("Library entry not found.");
			}

			const loggedTime = await tx.userGamePlayLog.aggregate({
				where: {
					entryId: log.entryId,
				},
				_sum: {
					hours: true,
				},
			});

			return tx.userGameEntry.update({
				where: {
					id: log.entryId,
					userId,
				},
				data: {
					timePlayed: current.timeMode === "logs" ? (loggedTime._sum.hours ?? null) : undefined,
				},
				include: {
					game: true,
					logs: {
						orderBy: {
							createdAt: "desc",
						},
					},
				},
			});
		});
	} catch (error) {
		logger.error("library", "updateUserGamePlayLog transaction failed", error);
		return inputError("Library entry not found.");
	}

	const tags = await getTagsForEntries([entry.id]);

	revalidatePath("/library/[slug]", "page");
	revalidatePath("/u/[user]", "page");
	return {
		...entry,
		tags: tags.get(entry.id) ?? [],
	};
}

export async function deleteUserGamePlayLog(logId: string) {
	const userId = await getCurrentUserId();
	let entry;

	try {
		entry = await db.$transaction(async (tx) => {
			const log = await tx.userGamePlayLog.delete({
				where: {
					id: logId,
					userId,
				},
				select: {
					entryId: true,
				},
			});

			const current = await tx.userGameEntry.findUnique({
				where: {
					id: log.entryId,
					userId,
				},
				select: {
					timeMode: true,
				},
			});

			if (!current) {
				throw new Error("Library entry not found.");
			}

			const loggedTime = await tx.userGamePlayLog.aggregate({
				where: {
					entryId: log.entryId,
				},
				_sum: {
					hours: true,
				},
			});

			return tx.userGameEntry.update({
				where: {
					id: log.entryId,
					userId,
				},
				data: {
					timePlayed: current.timeMode === "logs" ? (loggedTime._sum.hours ?? null) : undefined,
				},
				include: {
					game: true,
					logs: {
						orderBy: {
							createdAt: "desc",
						},
					},
				},
			});
		});
	} catch (error) {
		logger.error("library", "deleteUserGamePlayLog transaction failed", error);
		return inputError("Library entry not found.");
	}

	const tags = await getTagsForEntries([entry.id]);

	revalidatePath("/library/[slug]", "page");
	revalidatePath("/u/[user]", "page");
	return {
		...entry,
		tags: tags.get(entry.id) ?? [],
	};
}
