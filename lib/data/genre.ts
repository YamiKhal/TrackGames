import db from "../db";
import { formatRawGenre } from "../external/igdb/util";
import type { Genre } from "../types";
import { getByIds, getBySlugs } from "./getter";

const select = {
    id: true,
    slug: true,
    name: true
}

const fetching = {
    endpoint: "genres",
    body: `fields slug, name;`
}

export async function getGenre(id: number): Promise<Genre | null>;
export async function getGenre(id: number[]): Promise<Genre[]>;
export async function getGenre(id: number | number[]): Promise<Genre | Genre[] | null> {
    const res = await getByIds(Array.isArray(id) ? id : [id], select, db.genre, fetching, formatRawGenre);
    return Array.isArray(id) ? res : res[0] ?? null;
}


export async function getGenreBySlug(slug: string): Promise<Genre | null>;
export async function getGenreBySlug(slug: string[]): Promise<Genre[]>;
export async function getGenreBySlug(slug: string | string[]): Promise<Genre | Genre[] | null> {
    const res = await getBySlugs(Array.isArray(slug) ? slug : [slug], select, db.genre, fetching, formatRawGenre);
    return Array.isArray(slug) ? res : res[0] ?? null;
}
