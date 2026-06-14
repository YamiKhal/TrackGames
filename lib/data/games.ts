import db from "../db";
import { formatRawGame } from "../igdb/util";
import { Game } from "../types";
import { getByIds, getBySlugs } from "./getter";

const gameSelect = {
    id: true,
    slug: true,
    name: true,
    summary: true,
    totalRating: true,
    releaseDate: true,
    cover: true,
    screenshots: true,
    videos: true,
    developers: true,
    publishers: true,
    platforms: true,
    genres: true,
    franchises: true,
    collections: true,
    similarGames: true,
};

const minifiedSelect = {
    id: true,
    slug: true,
    name: true,
    totalRating: true,
    releaseDate: true,
    cover: true,
};

const fetching = {
    endpoint: "games",
    body: `
        fields slug, name, summary, total_rating, first_release_date, cover.image_id, screenshots.image_id, videos.video_id, platforms.name, platforms.slug, involved_companies.company, involved_companies.developer, involved_companies.publisher, genres.name, genres.slug, franchises.name, franchises.slug, franchises.games, similar_games, collections.name, collections.slug, collections.games;
    `
}

export async function getGame(id: number): Promise<Game | null>;
export async function getGame(id: number[]): Promise<Game[]>;
export async function getGame(id: number | number[]): Promise<Game | Game[] | null> {
    const res = await getByIds(Array.isArray(id) ? id : [id], gameSelect, db.game, fetching, formatRawGame);
    return Array.isArray(id) ? res : res[0] ?? null;
}

export async function getMinifiedGame(id: number): Promise<Game | null>;
export async function getMinifiedGame(id: number[]): Promise<Game[]>;
export async function getMinifiedGame(id: number | number[]): Promise<Game | Game[] | null> {
    const res = await getByIds(Array.isArray(id) ? id : [id], minifiedSelect, db.game, fetching, formatRawGame);
    return Array.isArray(id) ? res : res[0] ?? null;
}

export async function getGameBySlug(slug: string): Promise<Game | null>;
export async function getGameBySlug(slug: string[]): Promise<Game[]>;
export async function getGameBySlug(slug: string | string[]): Promise<Game | Game[] | null> {
    const res = await getBySlugs(Array.isArray(slug) ? slug : [slug], gameSelect, db.game, fetching, formatRawGame);
    return Array.isArray(slug) ? res : res[0] ?? null;
}

export async function getMinifiedGameBySlug(slug: string): Promise<Game | null>;
export async function getMinifiedGameBySlug(slug: string[]): Promise<Game[]>;
export async function getMinifiedGameBySlug(slug: string | string[]): Promise<Game | Game[] | null> {
    const res = await getBySlugs(Array.isArray(slug) ? slug : [slug], minifiedSelect, db.game, fetching, formatRawGame);
    return Array.isArray(slug) ? res : res[0] ?? null;
}
