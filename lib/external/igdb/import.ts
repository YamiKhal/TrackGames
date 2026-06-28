import { formatRawCollection, formatRawCompany, formatRawFranchise, formatRawGame, formatRawGenre, formatRawKeyword, formatRawMultiplayerMode, formatRawPlatform, formatRawTheme } from "@/lib/external/igdb/util";
import type { RawCollection, RawCompany, RawFranchise, RawGame, RawGenre, RawKeyword, RawMultiplayerMode, RawPlatform, RawTheme } from "@/lib/types";

export const IGDB_BASE_URL = "https://api.igdb.com/v4";

export type DbClient = typeof import("@/lib/db").default;
export type ImportKind = "collections" | "franchises" | "genres" | "platforms" | "companies" | "keywords" | "themes" | "multiplayerModes" | "games";
export type ImportConfig<Raw, Formatted> = {
    kind: ImportKind;
    endpoint: string;
    fields: string;
    where?: string;
    emptySkip?: number;
    format: (raw: Raw) => Formatted;
    save: (db: DbClient, item: Formatted) => Promise<unknown>;
    delete: (db: DbClient, id: number) => Promise<unknown>;
};

function isSlugUniqueError(error: unknown) {
    if (typeof error !== "object" || error === null || !("code" in error) || error.code !== "P2002") {
        return false;
    }

    if ("message" in error && typeof error.message === "string" && error.message.includes("`slug`")) {
        return true;
    }

    return "meta" in error
        && typeof error.meta === "object"
        && error.meta !== null
        && "target" in error.meta
        && Array.isArray(error.meta.target)
        && error.meta.target.includes("slug");
}

export async function upsertById(model: { upsert: (args: any) => Promise<unknown>; update: (args: any) => Promise<unknown> }, item: { id: number; slug: string }) {
    try {
        return await model.upsert({ where: { id: item.id }, update: item, create: item });
    } catch (error) {
        if (!isSlugUniqueError(error)) throw error;

        const { id, ...data } = item;

        console.log(`[import] Slug "${item.slug}" already exists with another id. Updating by slug and preserving the existing id instead of replacing it with IGDB id ${id}.`);
        return model.update({ where: { slug: item.slug }, data });
    }
}

export const importConfigs: ImportConfig<unknown, unknown>[] = [
    {
        kind: "collections",
        endpoint: "collections",
        fields: "slug, name, games",
        where: "name != null & slug != null",
        format: (raw) => formatRawCollection(raw as RawCollection),
        save: (db, item) => upsertById(db.collection, item as { id: number; slug: string }),
        delete: (db, id) => db.collection.deleteMany({ where: { id } }),
    },
    {
        kind: "franchises",
        endpoint: "franchises",
        fields: "slug, name, games",
        where: "name != null & slug != null",
        format: (raw) => formatRawFranchise(raw as RawFranchise),
        save: (db, item) => upsertById(db.franchise, item as { id: number; slug: string }),
        delete: (db, id) => db.franchise.deleteMany({ where: { id } }),
    },
    {
        kind: "genres",
        endpoint: "genres",
        fields: "slug, name",
        where: "name != null & slug != null",
        format: (raw) => formatRawGenre(raw as RawGenre),
        save: (db, item) => upsertById(db.genre, item as { id: number; slug: string }),
        delete: (db, id) => db.genre.deleteMany({ where: { id } }),
    },
    {
        kind: "platforms",
        endpoint: "platforms",
        fields: "slug, name",
        where: "name != null & slug != null",
        format: (raw) => formatRawPlatform(raw as RawPlatform),
        save: (db, item) => upsertById(db.platform, item as { id: number; slug: string }),
        delete: (db, id) => db.platform.deleteMany({ where: { id } }),
    },
    {
        kind: "companies",
        endpoint: "companies",
        fields: "slug, name, logo.image_id, description, developed, published",
        where: "name != null & slug != null",
        format: (raw) => formatRawCompany(raw as RawCompany),
        save: (db, item) => upsertById(db.company, item as { id: number; slug: string }),
        delete: (db, id) => db.company.deleteMany({ where: { id } }),
    },
    {
        kind: "keywords",
        endpoint: "keywords",
        fields: "slug, name",
        where: "name != null & slug != null",
        format: (raw) => formatRawKeyword(raw as RawKeyword),
        save: (db, item) => upsertById(db.keyword, item as { id: number; slug: string }),
        delete: (db, id) => db.keyword.deleteMany({ where: { id } }),
    },
    {
        kind: "themes",
        endpoint: "themes",
        fields: "slug, name",
        where: "name != null & slug != null",
        format: (raw) => formatRawTheme(raw as RawTheme),
        save: (db, item) => upsertById(db.theme, item as { id: number; slug: string }),
        delete: (db, id) => db.theme.deleteMany({ where: { id } }),
    },
    {
        kind: "multiplayerModes",
        endpoint: "multiplayer_modes",
        fields: "campaigncoop, dropin, game, lancoop, offlinecoop, offlinecoopmax, offlinemax, onlinecoop, onlinecoopmax, onlinemax, platform, splitscreen",
        where: "game != null & platform != null",
        format: (raw) => formatRawMultiplayerMode(raw as RawMultiplayerMode),
        save: (db, item) => db.multiplayerMode.upsert({ where: { id: (item as { id: number }).id }, update: item as any, create: item as any }),
        delete: (db, id) => db.multiplayerMode.deleteMany({ where: { id } }),
    },
    {
        kind: "games",
        endpoint: "games",
        fields: "slug, name, summary, total_rating, total_rating_count, first_release_date, cover.image_id, screenshots.image_id, videos.video_id, platforms.name, platforms.slug, involved_companies.company, involved_companies.developer, involved_companies.publisher, genres.name, genres.slug, franchises.name, franchises.slug, franchises.games, similar_games, collections.name, collections.slug, collections.games, standalone_expansions, dlcs, expanded_games, expansions, themes, player_perspectives.slug, multiplayer_modes, keywords, version_parent, parent_game, game_status, game_type",
        where: "name != null & slug != null",
        format: (raw) => formatRawGame(raw as RawGame),
        save: (db, item) => upsertById(db.game, item as { id: number; slug: string }),
        delete: (db, id) => db.game.deleteMany({ where: { id } }),
    },
];
