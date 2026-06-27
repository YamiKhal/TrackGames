import db from "../db";
import { formatRawKeyword } from "../external/igdb/util";
import type { Keyword } from "../types";
import { getByIds, getBySlugs } from "./getter";

const select = {
    id: true,
    slug: true,
    name: true
}

const fetching = {
    endpoint: "keywords",
    body: `fields slug, name;`
}

export async function getKeyword(id: number): Promise<Keyword | null>;
export async function getKeyword(id: number[]): Promise<Keyword[]>;
export async function getKeyword(id: number | number[]): Promise<Keyword | Keyword[] | null> {
    const res = await getByIds(Array.isArray(id) ? id : [id], select, db.keyword, fetching, formatRawKeyword);
    return Array.isArray(id) ? res : res[0] ?? null;
}


export async function getKeywordBySlug(slug: string): Promise<Keyword | null>;
export async function getKeywordBySlug(slug: string[]): Promise<Keyword[]>;
export async function getKeywordBySlug(slug: string | string[]): Promise<Keyword | Keyword[] | null> {
    const res = await getBySlugs(Array.isArray(slug) ? slug : [slug], select, db.keyword, fetching, formatRawKeyword);
    return Array.isArray(slug) ? res : res[0] ?? null;
}

export async function searchKeywords(query: string): Promise<Keyword[]> {
    const search = query.trim();

    if (search.length < 2) return [];

    const [startsWith, contains] = await Promise.all([
        db.keyword.findMany({
            where: {
                name: {
                    startsWith: search,
                    mode: "insensitive",
                },
            },
            select,
            orderBy: { name: "asc" },
            take: 8,
        }),
        db.keyword.findMany({
            where: {
                name: {
                    contains: search,
                    mode: "insensitive",
                },
            },
            select,
            orderBy: { name: "asc" },
            take: 16,
        }),
    ]);

    const keywords = new Map<number, Keyword>();

    for (const keyword of [...startsWith, ...contains]) {
        keywords.set(keyword.id, keyword);
    }

    return Array.from(keywords.values()).slice(0, 12);
}
