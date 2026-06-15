import db from "../db";
import { formatRawFranchise } from "../external/igdb/util";
import { Franchise } from "../types";
import { getByIds, getBySlugs } from "./getter";

const select = {
    id: true,
    slug: true,
    name: true,
    games: true
}

const fetching = {
    endpoint: "franchises",
    body: `fields slug, name, games;`
}

export async function getFranchise(id: number): Promise<Franchise | null>;
export async function getFranchise(id: number[]): Promise<Franchise[]>;
export async function getFranchise(id: number | number[]): Promise<Franchise | Franchise[] | null> {
    const res = await getByIds(Array.isArray(id) ? id : [id], select, db.franchise, fetching, formatRawFranchise);
    return Array.isArray(id) ? res : res[0] ?? null;
}


export async function getFranchiseBySlug(slug: string): Promise<Franchise | null>;
export async function getFranchiseBySlug(slug: string[]): Promise<Franchise[]>;
export async function getFranchiseBySlug(slug: string | string[]): Promise<Franchise | Franchise[] | null> {
    const res = await getBySlugs(Array.isArray(slug) ? slug : [slug], select, db.franchise, fetching, formatRawFranchise);
    return Array.isArray(slug) ? res : res[0] ?? null;
}
