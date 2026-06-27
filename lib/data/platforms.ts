import db from "../db";
import { formatRawGenre, formatRawPlatform } from "../external/igdb/util";
import type { Platform } from "../types";
import { getByIds, getBySlugs } from "./getter";

const select = {
    id: true,
    slug: true,
    name: true
}

const fetching = {
    endpoint: "platforms",
    body: `fields slug, name;`
}

export async function getPlatform(id: number): Promise<Platform | null>;
export async function getPlatform(id: number[]): Promise<Platform[]>;
export async function getPlatform(id: number | number[]): Promise<Platform | Platform[] | null> {
    const res = await getByIds(Array.isArray(id) ? id : [id], select, db.platform, fetching, formatRawPlatform);
    return Array.isArray(id) ? res : res[0] ?? null;
}


export async function getPlatformBySlug(slug: string): Promise<Platform | null>;
export async function getPlatformBySlug(slug: string[]): Promise<Platform[]>;
export async function getPlatformBySlug(slug: string | string[]): Promise<Platform | Platform[] | null> {
    const res = await getBySlugs(Array.isArray(slug) ? slug : [slug], select, db.platform, fetching, formatRawPlatform);
    return Array.isArray(slug) ? res : res[0] ?? null;
}
