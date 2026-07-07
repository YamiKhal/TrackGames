import { makeGetById, makeGetBySlug } from "@/lib/data/getter";
import db from "@/lib/db";
import { formatRawGenre } from "@/lib/external/igdb/util";
import type { GenreModel } from "@/lib/generated/prisma/models/Genre";

export type Genre = Pick<GenreModel, "id" | "slug" | "name">;

const select = {
	id: true,
	slug: true,
	name: true,
};

const fetching = {
	endpoint: "genres",
	body: `fields slug, name;`,
};

export const getGenre = makeGetById<Genre>(select, db.genre, fetching, formatRawGenre);

export const getGenreBySlug = makeGetBySlug<Genre>(select, db.genre, fetching, formatRawGenre);

/** Lists genres for the filter picker, optionally narrowed by a case-insensitive name query. */
export async function listGenres(query?: string): Promise<Genre[]> {
	return db.genre.findMany({
		where: query ? { name: { contains: query.trim(), mode: "insensitive" } } : undefined,
		select,
		orderBy: { name: "asc" },
		take: 50,
	});
}
