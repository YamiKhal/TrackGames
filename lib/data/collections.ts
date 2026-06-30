import db from "../db";
import { formatRawCollection } from "../external/igdb/util";
import type { Collection, MaybeArray } from "../types";
import { getByIds, getBySlugs } from "./getter";

type DataResult<T extends MaybeArray<number>> = T extends number[] ? Collection[] : Collection | null;

type SlugResult<T extends string | string[]> = T extends string[] ? Collection[] : Collection | null;

const select = {
	id: true,
	slug: true,
	name: true,
	games: true,
};

const fetching = {
	endpoint: "collections",
	body: `fields slug, name, games;`,
};

export async function getCollection<T extends MaybeArray<number>>(id: T): Promise<DataResult<T>> {
	const ids = Array.isArray(id) ? id : [id];
	const res = await getByIds(ids as number[], select, db.collection, fetching, formatRawCollection);
	return (Array.isArray(id) ? res : (res[0] ?? null)) as DataResult<T>;
}

export async function getCollectionBySlug<T extends string | string[]>(slug: T): Promise<SlugResult<T>> {
	const slugs = Array.isArray(slug) ? slug : [slug];
	const res = await getBySlugs(slugs as string[], select, db.collection, fetching, formatRawCollection);
	return (Array.isArray(slug) ? res : (res[0] ?? null)) as SlugResult<T>;
}
