import db from "../db";
import { formatRawCollection } from "../external/igdb/util";
import { Collection } from "../types";
import { getByIds, getBySlugs } from "./getter";

const select = {
    id: true,
    slug: true,
    name: true,
    games: true
}

const fetching = {
    endpoint: "collections",
    body: `fields slug, name, games;`
}

export async function getCollection(id: number): Promise<Collection | null>;
export async function getCollection(id: number[]): Promise<Collection[]>;
export async function getCollection(id: number | number[]): Promise<Collection | Collection[] | null> {
    const res = await getByIds(Array.isArray(id) ? id : [id], select, db.collection, fetching, formatRawCollection);
    return Array.isArray(id) ? res : res[0] ?? null;
}


export async function getCollectionBySlug(slug: string): Promise<Collection | null>;
export async function getCollectionBySlug(slug: string[]): Promise<Collection[]>;
export async function getCollectionBySlug(slug: string | string[]): Promise<Collection | Collection[] | null> {
    const res = await getBySlugs(Array.isArray(slug) ? slug : [slug], select, db.collection, fetching, formatRawCollection);
    return Array.isArray(slug) ? res : res[0] ?? null;
}
