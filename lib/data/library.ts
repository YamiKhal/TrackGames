import db from "../db";
import { GameStatus } from "../generated/prisma/enums";
import type { UserGameEntryGetPayload } from "../generated/prisma/models/UserGameEntry";
import type { Game } from "../types";

const userGameEntryInclude = {
    game: true,
    userGamePlayLogs: {
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

    for (const row of rows.sort((a, b) =>
        a.tag.name.toLowerCase().localeCompare(b.tag.name.toLowerCase()) || a.tag.name.localeCompare(b.tag.name)
    )) {
        tags.set(row.entryId, [...(tags.get(row.entryId) ?? []), { id: row.tag.id, name: row.tag.name }]);
    }

    return tags;
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

    return ids.map((id) => gamesById.get(id)).filter((game): game is typeof games[number] => Boolean(game)).map((game) => ({
        ...game,
        totalRating: game.totalRating ?? undefined,
        releaseDate: game.releaseDate ?? undefined,
        cover: game.cover ?? undefined,
    }));
}
