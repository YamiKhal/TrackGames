import db from "../db";
import { formatRawGame } from "../external/igdb/util";
import { GameListType, GameStatus } from "../generated/prisma/enums";
import type { Game } from "../types";
import { getByIds, getBySlugs } from "./getter";

const gameSelect = {
    id: true,
    slug: true,
    name: true,
    summary: true,
    totalRating: true,
    releaseDate: true,
    cover: true,
    screenshots: true,
    videos: true,
    developers: true,
    publishers: true,
    platforms: true,
    genres: true,
    franchises: true,
    collections: true,
    similarGames: true,
};

const minifiedSelect = {
    id: true,
    slug: true,
    name: true,
    totalRating: true,
    releaseDate: true,
    cover: true,
    keywords: true,
    gameType: true,
};

const searchSelect = {
    id: true,
    slug: true,
    name: true,
    totalRating: true,
    releaseDate: true,
    gameType: true,
};

const fetching = {
    endpoint: "games",
    body: `
        fields slug, name, summary, total_rating, first_release_date, cover.image_id, screenshots.image_id, videos.video_id, platforms.name, platforms.slug, involved_companies.company, involved_companies.developer, involved_companies.publisher, genres.name, genres.slug, franchises.name, franchises.slug, franchises.games, similar_games, collections.name, collections.slug, collections.games;
    `
}

export async function getGame(id: number): Promise<Game | null>;
export async function getGame(id: number[]): Promise<Game[]>;
export async function getGame(id: number | number[]): Promise<Game | Game[] | null> {
    const res = await getByIds(Array.isArray(id) ? id : [id], gameSelect, db.game, fetching, formatRawGame);
    return Array.isArray(id) ? res : res[0] ?? null;
}

export async function getMinifiedGame(id: number): Promise<Game | null>;
export async function getMinifiedGame(id: number[]): Promise<Game[]>;
export async function getMinifiedGame(id: number | number[]): Promise<Game | Game[] | null> {
    const res = await getByIds(Array.isArray(id) ? id : [id], minifiedSelect, db.game, fetching, formatRawGame);
    return Array.isArray(id) ? res : res[0] ?? null;
}

export async function getGameBySlug(slug: string): Promise<Game | null>;
export async function getGameBySlug(slug: string[]): Promise<Game[]>;
export async function getGameBySlug(slug: string | string[]): Promise<Game | Game[] | null> {
    const res = await getBySlugs(Array.isArray(slug) ? slug : [slug], gameSelect, db.game, fetching, formatRawGame);
    return Array.isArray(slug) ? res : res[0] ?? null;
}

export async function getGameStats(gameId: number) {
    const [
        plays,
        backlog,
        wishlisted,
        publicPlaylistEntries,
        averageTimes,
        ratings,
    ] = await Promise.all([
        db.userGamePlayLog.count({ where: { gameId } }),
        db.userGameEntry.count({
            where: {
                gameId,
                status: GameStatus.BACKLOG,
            },
        }),
        db.userGameEntry.count({
            where: {
                gameId,
                status: GameStatus.WISHLIST,
            },
        }),
        db.gameListEntry.count({
            where: {
                gameId,
                list: {
                    type: GameListType.PLAYLIST,
                    privacy: "public",
                },
            },
        }),
        db.userGameEntry.aggregate({
            where: { gameId },
            _avg: {
                timePlayed: true,
                timeFinished: true,
                timeMastered: true,
            },
        }),
        db.userGameEntry.groupBy({
            by: ["rating"],
            where: {
                gameId,
                rating: {
                    not: null,
                },
            },
            _count: {
                rating: true,
            },
        }),
    ]);
    const ratingDistribution = Array.from({ length: 11 }, (_, index) => {
        const value = index * 0.5;
        const count = ratings.reduce((total, rating) => {
            const stars = rating.rating == null ? 0 : Math.round(rating.rating / 20 * 2) / 2;
            return stars === value ? total + rating._count.rating : total;
        }, 0);

        return { rating: value, count };
    });

    return {
        plays,
        backlog,
        wishlisted,
        publicPlaylistEntries,
        averagePlaytime: averageTimes._avg.timePlayed,
        averageCompletionTime: averageTimes._avg.timeFinished,
        averageMasteryTime: averageTimes._avg.timeMastered,
        ratingDistribution,
    };
}

export async function getMinifiedGameBySlug(slug: string): Promise<Game | null>;
export async function getMinifiedGameBySlug(slug: string[]): Promise<Game[]>;
export async function getMinifiedGameBySlug(slug: string | string[]): Promise<Game | Game[] | null> {
    const res = await getBySlugs(Array.isArray(slug) ? slug : [slug], minifiedSelect, db.game, fetching, formatRawGame);
    return Array.isArray(slug) ? res : res[0] ?? null;
}

export async function searchGames(query: string): Promise<Game[]> {
    const search = query.trim();

    if (search.length < 2) return [];

    const lowerSearch = search.toLowerCase();
    const contains = `%${lowerSearch}%`;
    const startsWith = `${lowerSearch}%`;
    const [nameMatches, keywordIds] = await Promise.all([
        db.$queryRaw<Game[]>`
            SELECT
                "id",
                "slug",
                "name",
                "totalRating",
                "releaseDate",
                "gameType"
            FROM "Game"
            WHERE lower("name") LIKE ${contains}
            ORDER BY
                CASE
                    WHEN lower("name") = ${lowerSearch} THEN 0
                    WHEN lower("name") LIKE ${startsWith} THEN 1
                    ELSE 2
                END,
                CASE "gameType"
                    WHEN 'MAINGAME' THEN 0
                    WHEN 'DLC' THEN 1
                    ELSE 2
                END,
                "totalRating" DESC NULLS LAST,
                lower("name") ASC
            LIMIT 16
        `,
        db.keyword.findMany({
            where: {
                name: {
                    contains: search,
                    mode: "insensitive",
                },
            },
            select: { id: true },
            take: 16,
        }),
    ]);
    const keywordMatches = keywordIds.length ? await db.game.findMany({
        where: {
            keywords: {
                hasSome: keywordIds.map((keyword) => keyword.id),
            },
        },
        select: searchSelect,
        orderBy: [
            { totalRating: "desc" },
            { name: "asc" },
        ],
        take: 12,
    }) : [];
    const games = new Map<number, Game>();

    for (const game of [...nameMatches, ...keywordMatches]) {
        if (!game.id) continue;

        games.set(game.id, {
            ...game,
            totalRating: game.totalRating ?? undefined,
            releaseDate: game.releaseDate ?? undefined,
        });
    }

    const rows = Array.from(games.values()).sort((a, b) => {
        const aName = a.name?.toLowerCase() ?? "";
        const bName = b.name?.toLowerCase() ?? "";
        const aType = a.gameType === "MAINGAME" ? 0 : a.gameType === "DLC" ? 1 : 2;
        const bType = b.gameType === "MAINGAME" ? 0 : b.gameType === "DLC" ? 1 : 2;
        const aMatch = aName === lowerSearch ? 0 : aName.startsWith(lowerSearch) ? 1 : aName.includes(lowerSearch) ? 2 : 3;
        const bMatch = bName === lowerSearch ? 0 : bName.startsWith(lowerSearch) ? 1 : bName.includes(lowerSearch) ? 2 : 3;

        return aMatch - bMatch
            || aType - bType
            || (b.totalRating ?? 0) - (a.totalRating ?? 0)
            || aName.localeCompare(bName);
    }).slice(0, 8);

    return rows.map((game) => ({
        ...game,
        totalRating: game.totalRating ?? undefined,
        releaseDate: game.releaseDate ?? undefined,
    }));
}
