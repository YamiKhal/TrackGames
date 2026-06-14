import db from "../db";
import { formatRawCompany } from "../igdb/util";
import { Company } from "../types";
import { getByIds, getBySlugs } from "./getter";

const select = {
    id: true,
    slug: true,
    name: true,
    logo: true,
    description: true,
    developed: true,
    published: true
}

const minifiedSelect = {
    id: true,
    slug: true,
    name: true,
}

const fetching = {
    endpoint: "companies",
    body: `fields slug, name, logo.image_id, description, developed, published;`
}

export async function getCompany(id: number): Promise<Company | null>;
export async function getCompany(id: number[]): Promise<Company[]>;
export async function getCompany(id: number | number[]): Promise<Company | Company[] | null> {
    const res = await getByIds(Array.isArray(id) ? id : [id], select, db.company, fetching, formatRawCompany);
    return Array.isArray(id) ? res : res[0] ?? null;
}


export async function getCompanyBySlug(slug: string): Promise<Company | null>;
export async function getCompanyBySlug(slug: string[]): Promise<Company[]>;
export async function getCompanyBySlug(slug: string | string[]): Promise<Company | Company[] | null> {
    const res = await getBySlugs(Array.isArray(slug) ? slug : [slug], select, db.company, fetching, formatRawCompany);
    return Array.isArray(slug) ? res : res[0] ?? null;
}


export async function getMinifiedCompany(id: number): Promise<Company | null>;
export async function getMinifiedCompany(id: number[]): Promise<Company[]>;
export async function getMinifiedCompany(id: number | number[]): Promise<Company | Company[] | null> {
    const res = await getByIds(Array.isArray(id) ? id : [id], minifiedSelect, db.company, fetching, formatRawCompany);
    return Array.isArray(id) ? res : res[0] ?? null;
}


export async function getMiniifedCompanyBySlug(slug: string): Promise<Company | null>;
export async function getMiniifedCompanyBySlug(slug: string[]): Promise<Company[]>;
export async function getMiniifedCompanyBySlug(slug: string | string[]): Promise<Company | Company[] | null> {
    const res = await getBySlugs(Array.isArray(slug) ? slug : [slug], minifiedSelect, db.company, fetching, formatRawCompany);
    return Array.isArray(slug) ? res : res[0] ?? null;
}