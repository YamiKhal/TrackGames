import { type MultiplayerFilterKey } from "@/lib/data/filters";
import { makeGetById, makeGetBySlug } from "@/lib/data/getter";
import db from "@/lib/db";
import { formatRawGame } from "@/lib/external/igdb/util";
import type { Prisma } from "@/lib/generated/prisma/client";
import { GameListType, GameStatus, type PlayerPerspective } from "@/lib/generated/prisma/enums";
import type { GameModel } from "@/lib/generated/prisma/models/Game";

export type Game = Partial<
	Pick<
		GameModel,
		| "id"
		| "slug"
		| "name"
		| "summary"
		| "totalRating"
		| "totalRatingCount"
		| "releaseDate"
		| "cover"
		| "screenshots"
		| "videos"
		| "platforms"
		| "developers"
		| "publishers"
		| "genres"
		| "franchises"
		| "collections"
		| "similarGames"
		| "standaloneExpansions"
		| "dlcs"
		| "expandedGames"
		| "expansions"
		| "themes"
		| "playerPerspectives"
		| "multiplayerModes"
		| "keywords"
		| "versionParent"
		| "parentGame"
		| "gameStatus"
		| "gameType"
	>
>;

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
	themes: true,
	franchises: true,
	collections: true,
	similarGames: true,
	dlcs: true,
	expansions: true,
	standaloneExpansions: true,
	expandedGames: true,
	multiplayerModes: true,
	versionParent: true,
	parentGame: true,
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
	cover: true,
	gameType: true,
	versionParent: true,
};

const fetching = {
	endpoint: "games",
	body: `
        fields slug, name, summary, total_rating, first_release_date, cover.image_id, screenshots.image_id, videos.video_id, platforms.name, platforms.slug, involved_companies.company, involved_companies.developer, involved_companies.publisher, genres.name, genres.slug, themes, franchises.name, franchises.slug, franchises.games, similar_games, collections.name, collections.slug, collections.games, dlcs, expansions, standalone_expansions, expanded_games, multiplayer_modes, version_parent, parent_game;
    `,
};

export const getGame = makeGetById<Game>(gameSelect, db.game, fetching, formatRawGame);

export const getMinifiedGame = makeGetById<Game>(minifiedSelect, db.game, fetching, formatRawGame);

export const getGameBySlug = makeGetBySlug<Game>(gameSelect, db.game, fetching, formatRawGame);

export const getMinifiedGameBySlug = makeGetBySlug<Game>(minifiedSelect, db.game, fetching, formatRawGame);

export async function getGameStats(gameId: number) {
	const [plays, backlog, wishlisted, publicPlaylistEntries, averageTimes, ratings] = await Promise.all([
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
			const stars = rating.rating === null ? 0 : Math.round((rating.rating / 20) * 2) / 2;
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

export async function searchGames(query: string, limit = 8): Promise<Game[]> {
	const search = query.trim();

	if (search.length < 2) return [];

	const resultLimit = Math.max(1, Math.min(limit, 320));
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
                "cover",
                "gameType",
                "versionParent"
            FROM "Game"
            WHERE lower("name") LIKE ${contains}
            ORDER BY
                CASE
                    WHEN lower("name") = ${lowerSearch} THEN 0
                    WHEN lower("name") LIKE ${startsWith} THEN 1
                    ELSE 2
                END,
                CASE WHEN "versionParent" IS NULL THEN 0 ELSE 1 END,
                CASE "gameType"
                    WHEN 'MAINGAME' THEN 0
                    WHEN 'DLC' THEN 1
                    ELSE 2
                END,
                "totalRating" DESC NULLS LAST,
                lower("name") ASC
            LIMIT ${Math.max(16, resultLimit * 2)}
        `,
		db.keyword.findMany({
			where: {
				name: {
					contains: search,
					mode: "insensitive",
				},
			},
			select: { id: true },
			take: Math.max(16, resultLimit * 2),
		}),
	]);
	const keywordMatches = keywordIds.length
		? await db.game.findMany({
				where: {
					keywords: {
						hasSome: keywordIds.map((keyword) => keyword.id),
					},
				},
				select: searchSelect,
				orderBy: [{ versionParent: { sort: "asc", nulls: "first" } }, { totalRating: "desc" }, { name: "asc" }],
				take: Math.max(12, resultLimit),
			})
		: [];
	const games = new Map<number, Game>();

	for (const game of [...nameMatches, ...keywordMatches]) {
		if (!game.id) continue;

		games.set(game.id, {
			...game,
			totalRating: game.totalRating ?? undefined,
			releaseDate: game.releaseDate ?? undefined,
			cover: game.cover ?? undefined,
			versionParent: game.versionParent ?? null,
		});
	}

	const rows = Array.from(games.values())
		.sort((a, b) => {
			const aName = a.name?.toLowerCase() ?? "";
			const bName = b.name?.toLowerCase() ?? "";
			const aTypeDLC = a.gameType === "DLC" ? 1 : 2;
			const aType = a.gameType === "MAINGAME" ? 0 : aTypeDLC;
			const bTypeDLC = b.gameType === "DLC" ? 1 : 2;
			const bType = b.gameType === "MAINGAME" ? 0 : bTypeDLC;
			const aEdition = a.versionParent === null ? 0 : 1;
			const bEdition = b.versionParent === null ? 0 : 1;
			const aNIncludesMatch = aName.includes(lowerSearch) ? 2 : 3;
			const aNMatch = aName.startsWith(lowerSearch) ? 1 : aNIncludesMatch;
			const aMatch = aName === lowerSearch ? 0 : aNMatch;
			const bNIncludesMatch = bName.includes(lowerSearch) ? 2 : 3;
			const bNMatch = bName.startsWith(lowerSearch) ? 1 : bNIncludesMatch;
			const bMatch = bName === lowerSearch ? 0 : bNMatch;

			return aMatch - bMatch || aEdition - bEdition || aType - bType || (b.totalRating ?? 0) - (a.totalRating ?? 0) || aName.localeCompare(bName);
		})
		.slice(0, resultLimit);

	return rows.map((game) => ({
		...game,
		totalRating: game.totalRating ?? undefined,
		releaseDate: game.releaseDate ?? undefined,
	}));
}

export type GameFilters = {
	genres?: number[];
	themes?: number[];
	platforms?: number[];
	perspectives?: PlayerPerspective[];
	multiplayerModes?: MultiplayerFilterKey[];
	releaseFrom?: string;
	releaseTill?: string;
};

/**
 * Multi-facet game filter. Games must match every selected value across every facet (strict AND):
 * e.g. picking two genres returns only games that have both. Backs the `/filter` page.
 */
export async function filterGames(filters: GameFilters, limit = 32): Promise<Game[]> {
	const resultLimit = Math.max(1, Math.min(limit, 320));
	const where: Prisma.GameWhereInput = { versionParent: null };
	const and: Prisma.GameWhereInput[] = [];

	if (filters.genres?.length) and.push({ genres: { hasEvery: filters.genres } });
	if (filters.themes?.length) and.push({ themes: { hasEvery: filters.themes } });
	if (filters.platforms?.length) and.push({ platforms: { hasEvery: filters.platforms } });
	if (filters.perspectives?.length) and.push({ playerPerspectives: { hasEvery: filters.perspectives } });

	if (filters.multiplayerModes?.length) {
		// Multiplayer data lives in a separate table (one row per platform), so resolve the game ids
		// per mode and intersect them: a game must offer every selected mode across its rows.
		const perModeIds = await Promise.all(
			filters.multiplayerModes.map(async (mode) => {
				const rows = await db.multiplayerMode.findMany({ where: { [mode]: true }, select: { game: true } });
				return new Set(rows.map((row) => row.game));
			}),
		);
		const gameIds = perModeIds.reduce((acc, ids) => acc.filter((id) => ids.has(id)), Array.from(perModeIds[0]));

		if (!gameIds.length) return [];

		and.push({ id: { in: gameIds } });
	}

	if (filters.releaseFrom || filters.releaseTill) {
		// `till` is inclusive of the whole day, so bump it to the start of the next day.
		const till = filters.releaseTill ? new Date(filters.releaseTill) : undefined;
		if (till) till.setUTCDate(till.getUTCDate() + 1);

		and.push({
			releaseDate: {
				...(filters.releaseFrom ? { gte: new Date(filters.releaseFrom) } : {}),
				...(till ? { lt: till } : {}),
			},
		});
	}

	if (!and.length) return [];

	where.AND = and;

	const games = await db.game.findMany({
		where,
		select: searchSelect,
		orderBy: [{ totalRating: "desc" }, { name: "asc" }],
		take: resultLimit,
	});

	return games.map((game) => ({
		...game,
		totalRating: game.totalRating ?? undefined,
		releaseDate: game.releaseDate ?? undefined,
		versionParent: game.versionParent ?? null,
	}));
}
