import { cache } from "react";
import type { Game } from "@/lib/data/catalog/games";
import db from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { GameStatus } from "@/lib/generated/prisma/enums";
import type { UserGameEntryGetPayload } from "@/lib/generated/prisma/models/UserGameEntry";

const userGameEntryInclude = {
	game: true,
	logs: {
		orderBy: {
			playedAt: "desc" as const,
		},
	},
} as const;

export type UserLibraryEntry = UserGameEntryGetPayload<{ include: typeof userGameEntryInclude }>;
export type UserLibraryTag = { id: string; name: string };
export type UserLibraryEntryWithTags = UserLibraryEntry & { tags: UserLibraryTag[] };

export async function getTagsForEntries(entryIds: string[]) {
	if (!entryIds.length) return new Map<string, UserLibraryTag[]>();

	const rows = await db.userGameEntryTag.findMany({
		where: {
			entryId: {
				in: entryIds,
			},
		},
		select: {
			entryId: true,
			tag: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});
	const tags = new Map<string, UserLibraryTag[]>();

	for (const row of rows.toSorted((a, b) => a.tag.name.toLowerCase().localeCompare(b.tag.name.toLowerCase()) || a.tag.name.localeCompare(b.tag.name))) {
		tags.set(row.entryId, [...(tags.get(row.entryId) ?? []), { id: row.tag.id, name: row.tag.name }]);
	}

	return tags;
}

/**
 * Resolves tag names to ids (creating or renaming UserTag rows as needed)
 * and creates the UserGameEntryTag join rows for each entry, all batched.
 * Caller is responsible for clearing any existing join rows beforehand.
 */
export async function syncEntryTags(tx: Prisma.TransactionClient, userId: string, entryTagNames: Map<string, string[]>) {
	if (entryTagNames.size === 0) return;

	const normalizedNames = new Map<string, string>();
	for (const tagNames of entryTagNames.values()) {
		for (const name of tagNames) {
			normalizedNames.set(name.toLowerCase(), name);
		}
	}

	const existingTags = await tx.userTag.findMany({
		where: {
			userId,
			normalized: { in: [...normalizedNames.keys()] },
		},
		select: {
			id: true,
			name: true,
			normalized: true,
		},
	});
	const existingByNormalized = new Map(existingTags.map((tag) => [tag.normalized, tag]));

	await Promise.all(
		existingTags
			.filter((tag) => tag.name !== normalizedNames.get(tag.normalized))
			.map((tag) =>
				tx.userTag.update({
					where: { id: tag.id },
					data: { name: normalizedNames.get(tag.normalized)! },
				}),
			),
	);

	const missingNormalized = [...normalizedNames.keys()].filter((normalized) => !existingByNormalized.has(normalized));
	if (missingNormalized.length > 0) {
		await tx.userTag.createMany({
			data: missingNormalized.map((normalized) => ({
				userId,
				name: normalizedNames.get(normalized)!,
				normalized,
			})),
		});
	}

	const allTags = await tx.userTag.findMany({
		where: {
			userId,
			normalized: { in: [...normalizedNames.keys()] },
		},
		select: {
			id: true,
			normalized: true,
		},
	});
	const tagIdByNormalized = new Map(allTags.map((tag) => [tag.normalized, tag.id]));

	const joinRows = [...entryTagNames.entries()].flatMap(([entryId, tagNames]) =>
		tagNames.map((name) => ({
			entryId,
			tagId: tagIdByNormalized.get(name.toLowerCase())!,
		})),
	);
	await tx.userGameEntryTag.createMany({
		data: joinRows,
		skipDuplicates: true,
	});
}

/** Clears an entry's existing tags and replaces them with `tagNames`. */
export async function replaceEntryTags(tx: Prisma.TransactionClient, userId: string, entryId: string, tagNames: string[]) {
	await tx.userGameEntryTag.deleteMany({
		where: {
			entryId,
		},
	});

	if (tagNames.length > 0) {
		await syncEntryTags(tx, userId, new Map([[entryId, tagNames]]));
	}
}

export async function getUserGameEntries(userId: string): Promise<UserLibraryEntryWithTags[]> {
	const entries = await db.userGameEntry.findMany({
		where: {
			userId,
		},
		include: userGameEntryInclude,
		orderBy: {
			addedAt: "desc",
		},
	});
	const tags = await getTagsForEntries(entries.map((entry) => entry.id));

	return entries.map((entry) => ({
		...entry,
		tags: tags.get(entry.id) ?? [],
	}));
}

export async function getUserGameEntry(userId: string, gameId: number) {
	return await db.userGameEntry.findUnique({
		where: {
			userId_gameId: {
				userId,
				gameId,
			},
		},
		select: {
			id: true,
			status: true,
			rating: true,
		},
	});
}

export async function getUserGameEntryWithTags(userId: string, gameId: number): Promise<UserLibraryEntryWithTags | null> {
	const entry = await db.userGameEntry.findUnique({
		where: {
			userId_gameId: {
				userId,
				gameId,
			},
		},
		include: userGameEntryInclude,
	});

	if (!entry) return null;

	const tags = await getTagsForEntries([entry.id]);

	return {
		...entry,
		tags: tags.get(entry.id) ?? [],
	};
}

const viewerEntrySelect = {
	id: true,
	gameId: true,
	status: true,
	rating: true,
	timePlayed: true,
	timeFinished: true,
	timeMastered: true,
	finishedAt: true,
	masteredAt: true,
} as const;

export type ViewerGameEntry = UserGameEntryGetPayload<{ select: typeof viewerEntrySelect }> & { tags: UserLibraryTag[] };

export async function getViewerEntriesForGames(viewerId: string, gameIds: number[]): Promise<Map<number, ViewerGameEntry>> {
	if (!gameIds.length) return new Map();

	const entries = await db.userGameEntry.findMany({
		where: {
			userId: viewerId,
			gameId: {
				in: gameIds,
			},
		},
		select: viewerEntrySelect,
	});
	const tags = await getTagsForEntries(entries.map((entry) => entry.id));

	return new Map(
		entries.map((entry) => [
			entry.gameId,
			{
				...entry,
				tags: tags.get(entry.id) ?? [],
			},
		]),
	);
}

export async function getUserGameStats(userId: string) {
	const entries = await db.userGameEntry.findMany({
		where: {
			userId,
		},
		select: {
			status: true,
			timePlayed: true,
			timeFinished: true,
			finishedAt: true,
		},
	});

	return {
		total: entries.length,
		played: entries.filter((entry) => entry.status !== GameStatus.BACKLOG).length,
		completed: entries.filter((entry) => entry.status === GameStatus.COMPLETED || entry.finishedAt || entry.timeFinished != null).length,
		backlog: entries.filter((entry) => entry.status === GameStatus.BACKLOG).length,
		wishlist: entries.filter((entry) => entry.status === GameStatus.WISHLIST).length,
		wishlisted: entries.filter((entry) => entry.status === GameStatus.WISHLIST).length,
		dropped: entries.filter((entry) => entry.status === GameStatus.DROPPED).length,
		playing: entries.filter((entry) => entry.status === GameStatus.PLAYING).length,
		paused: entries.filter((entry) => entry.status === GameStatus.PAUSED).length,
		hours: entries.reduce((total, entry) => total + (entry.timePlayed ?? 0), 0),
	};
}

export async function searchUserLibraryGames(userId: string, query: string): Promise<Game[]> {
	const search = query.trim();

	if (search.length < 2) return [];

	const lowerSearch = search.toLowerCase();
	const contains = `%${lowerSearch}%`;
	const startsWith = `${lowerSearch}%`;

	return await db.$queryRaw<Game[]>`
        SELECT
            "Game"."id",
            "Game"."slug",
            "Game"."name",
            "Game"."totalRating",
            "Game"."releaseDate",
            "Game"."cover",
            "Game"."gameType"
        FROM "UserGameEntry"
        INNER JOIN "Game" ON "Game"."id" = "UserGameEntry"."gameId"
        WHERE "UserGameEntry"."userId" = ${userId}
            AND lower("Game"."name") LIKE ${contains}
        ORDER BY
            CASE
                WHEN lower("Game"."name") = ${lowerSearch} THEN 0
                WHEN lower("Game"."name") LIKE ${startsWith} THEN 1
                ELSE 2
            END,
            lower("Game"."name") ASC
        LIMIT 8
    `;
}

const gameListSelect = {
	id: true,
	type: true,
	userId: true,
	displayMode: true,
	tierColors: true,
	tierLabels: true,
	name: true,
	slug: true,
	description: true,
	image: true,
	background: true,
	color: true,
	accentColor: true,
	privacy: true,
	commentsHidden: true,
	entries: true,
	user: {
		select: {
			libraryPrivacy: true,
		},
	},
};

export const ensureAndGetUserLibrary = cache(async (slug: string) => {
	const user = await db.user.findFirst({
		where: {
			name: slug,
		},
		select: {
			id: true,
			name: true,
			libraryPrivacy: true,
		},
	});

	if (!user) return null;

	const library = await db.gameList.findFirst({
		where: {
			slug,
			userId: user.id,
		},
		select: gameListSelect,
	});

	if (library) return library;

	return await db.gameList.create({
		data: {
			userId: user.id,
			type: "LIBRARY",
			name: `${user.name}'s Library`,
			slug: `${user.name}`,
			privacy: "public",
		},
		select: gameListSelect,
	});
});

export async function getUserLibraryGamesByIds(userId: string, ids: number[]): Promise<Game[]> {
	if (!ids.length) return [];

	const games = await db.game.findMany({
		where: {
			id: { in: ids },
			users: {
				some: {
					userId,
				},
			},
		},
		select: {
			id: true,
			slug: true,
			name: true,
			totalRating: true,
			releaseDate: true,
			cover: true,
			gameType: true,
		},
	});
	const gamesById = new Map(games.map((game) => [game.id, game]));

	return ids
		.map((id) => gamesById.get(id))
		.filter((game): game is (typeof games)[number] => Boolean(game))
		.map((game) => ({
			...game,
			totalRating: game.totalRating ?? undefined,
			releaseDate: game.releaseDate ?? undefined,
			cover: game.cover ?? undefined,
		}));
}
