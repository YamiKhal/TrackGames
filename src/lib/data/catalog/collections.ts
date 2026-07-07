import { makeGetById, makeGetBySlug } from "@/lib/data/getter";
import db from "@/lib/db";
import { formatRawCollection } from "@/lib/external/igdb/util";
import type { CollectionModel } from "@/lib/generated/prisma/models/Collection";

export type Collection = Pick<CollectionModel, "id" | "slug" | "name" | "games">;

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

export const getCollection = makeGetById<Collection>(select, db.collection, fetching, formatRawCollection);

export const getCollectionBySlug = makeGetBySlug<Collection>(select, db.collection, fetching, formatRawCollection);
