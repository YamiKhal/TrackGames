/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client/extension";
import { fetchAPI } from "../external/igdb/igdb-api";

export async function getFallback<T>(select: object, database: PrismaClient, fetching: { endpoint: string; body: string }, formatter: (data: any) => T): Promise<T[]> {
	const fallbackData = await fetchAPI<any[]>(fetching.endpoint, fetching.body);

	const saved = await Promise.all(
		fallbackData.map((raw) => {
			const data = formatter(raw);

			return database.upsert({
				where: { id: (data as { id: number }).id! },
				update: data as any,
				create: data as any,
				select,
			} as any);
		}),
	);

	return saved as T[];
}

export async function getByIds<T>(ids: number[], select: object, database: PrismaClient, fetching: { endpoint: string; body: string }, formatter: (data: any) => T): Promise<T[]> {
	if (!ids.length) return [];

	const uniqueIds = Array.from(new Set(ids));
	const localData = (await database.findMany({
		where: { id: { in: uniqueIds } },
		select,
	})) as T[];

	const localIds = new Set(localData.map((entry) => (entry as any).id));
	const missingIds = uniqueIds.filter((id) => !localIds.has(id));

	fetching = {
		...fetching,
		body: fetching.body + `where id = (${missingIds.join(",")});` + " limit 500;",
	};

	const fallbackGames = missingIds.length ? await getFallback<T>(select, database, fetching, formatter) : [];

	const gamesById = new Map<number, T>();

	for (const game of [...localData, ...fallbackGames] as any) {
		if (typeof game.id === "number") {
			gamesById.set(game.id, game);
		}
	}

	return ids.map((id) => gamesById.get(id)).filter((game): game is T => Boolean(game));
}

export async function getBySlugs<T>(
	slugs: string[],
	select: object,
	database: PrismaClient,
	fetching: { endpoint: string; body: string },
	formatter: (data: any) => T,
): Promise<T[]> {
	if (!slugs.length) return [];

	const uniqueSlugs = Array.from(new Set(slugs.filter(Boolean)));
	if (!uniqueSlugs.length) return [];

	const localGames = (await database.findMany({
		where: { slug: { in: uniqueSlugs } },
		select,
	})) as T[];

	const localSlugs = new Set(localGames.map((entry) => (entry as any).slug));
	const missingSlugs = uniqueSlugs.filter((slug) => !localSlugs.has(slug));

	fetching = {
		...fetching,
		body: fetching.body + `where slug = (${missingSlugs.map((slug) => JSON.stringify(slug)).join(",")});` + " limit 500;",
	};

	const fallbackData = missingSlugs.length ? await getFallback<T>(select, database, fetching, formatter) : [];

	const gamesBySlug = new Map<string, T>();

	for (const game of [...localGames, ...fallbackData] as any) {
		if (game.slug) {
			gamesBySlug.set(game.slug, game);
		}
	}

	return slugs.map((slug) => gamesBySlug.get(slug)).filter((game): game is T => Boolean(game));
}
