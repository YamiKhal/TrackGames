import { RawCollection, RawCompany, RawFranchise, RawGame, RawGenre, RawPlatform } from "@/lib/types";
import { formatRawCollection, formatRawCompany, formatRawFranchise, formatRawGame, formatRawGenre, formatRawPlatform } from "@/lib/igdb/util";
import { loadEnvConfig } from "@next/env";
import fs from "fs/promises";

loadEnvConfig(process.cwd());

const IGDB_BASE_URL = "https://api.igdb.com/v4";
const LIMIT = 500;
const CHECKPOINT_FILE = "igdb-import-checkpoint.json";

type DbClient = typeof import("@/lib/db").default;
type ImportKind = "collections" | "franchises" | "genres" | "platforms" | "companies" | "games";
type Checkpoint = Partial<Record<ImportKind, number>>;
type ImportConfig<Raw, Formatted> = {
    kind: ImportKind;
    endpoint: string;
    fields: string;
    where?: string;
    emptySkip?: number;
    format: (raw: Raw) => Formatted;
    save: (db: DbClient, item: Formatted) => Promise<unknown>;
};

let db: DbClient | null = null;

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readCheckpoint(): Promise<Checkpoint> {
    try {
        const raw = await fs.readFile(CHECKPOINT_FILE, "utf8");
        const parsed = JSON.parse(raw);

        if (typeof parsed.lastSeenId === "number") {
            return { games: parsed.lastSeenId };
        }

        return parsed;
    } catch {
        return {};
    }
}

async function saveCheckpoint(checkpoint: Checkpoint) {
    await fs.writeFile(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2), "utf8");
}

async function fetchBatch<Raw, Formatted>(token: string, config: ImportConfig<Raw, Formatted>, lastSeenId: number): Promise<Raw[]> {
    const where = [`id > ${lastSeenId}`, config.where].filter(Boolean).join(" & ");
    const body = `
    fields ${config.fields};
    where ${where};
    sort id asc;
    limit ${LIMIT};
  `;

    const res = await fetch(`${IGDB_BASE_URL}/${config.endpoint}`, {
        method: "POST",
        headers: {
            "Client-ID": process.env.TWITCH_CLIENT_ID!,
            Authorization: `Bearer ${token}`,
        },
        body,
    });

    if (res.status === 429) {
        console.log(`[${config.kind}] Rate limited. Waiting 5 seconds...`);
        await sleep(5000);
        return fetchBatch(token, config, lastSeenId);
    }

    if (!res.ok) {
        const details = await res.text();
        throw new Error(`[${config.kind}] IGDB request failed with status ${res.status}: ${details}`);
    }

    return res.json();
}

async function importKind<Raw, Formatted>(token: string, checkpoint: Checkpoint, config: ImportConfig<Raw, Formatted>) {
    if (!db) {
        throw new Error("Database client was not initialized.");
    }

    let lastSeenId = checkpoint[config.kind] ?? 0;
    let totalImported = 0;
    let emptyBatches = 0;
    const emptySkip = config.emptySkip ?? LIMIT;

    console.log(`[${config.kind}] Starting import from id > ${lastSeenId}`);

    while (true) {
        const batch = await fetchBatch(token, config, lastSeenId);

        if (batch.length === 0) {
            emptyBatches++;
            console.log(`[${config.kind}] Empty batch found after id ${lastSeenId}.`);

            if (emptyBatches >= 3) {
                console.log(`[${config.kind}] No more records found.`);
                break;
            }

            lastSeenId += emptySkip;
            checkpoint[config.kind] = lastSeenId;
            await saveCheckpoint(checkpoint);
            await sleep(300);
            continue;
        }

        emptyBatches = 0;

        for (const raw of batch) {
            const formatted = config.format(raw);
            await config.save(db, formatted);
        }

        lastSeenId = (batch[batch.length - 1] as { id?: number }).id ?? lastSeenId;
        totalImported += batch.length;
        checkpoint[config.kind] = lastSeenId;
        await saveCheckpoint(checkpoint);

        console.log(`[${config.kind}] Imported ${batch.length}. Total: ${totalImported}. Last ID: ${lastSeenId}`);

        // IGDB allows 4 requests/sec. 300ms keeps us safely below the limit.
        await sleep(300);
    }
}

const importConfigs: ImportConfig<unknown, unknown>[] = [
    {
        kind: "collections",
        endpoint: "collections",
        fields: "slug, name, games",
        where: "name != null & slug != null",
        format: (raw) => formatRawCollection(raw as RawCollection),
        save: (db, item) => db.collection.upsert({ where: { id: (item as { id: number }).id }, update: item as any, create: item as any }),
    },
    {
        kind: "franchises",
        endpoint: "franchises",
        fields: "slug, name, games",
        where: "name != null & slug != null",
        format: (raw) => formatRawFranchise(raw as RawFranchise),
        save: (db, item) => db.franchise.upsert({ where: { id: (item as { id: number }).id }, update: item as any, create: item as any }),
    },
    {
        kind: "genres",
        endpoint: "genres",
        fields: "slug, name",
        where: "name != null & slug != null",
        format: (raw) => formatRawGenre(raw as RawGenre),
        save: (db, item) => db.genre.upsert({ where: { id: (item as { id: number }).id }, update: item as any, create: item as any }),
    },
    {
        kind: "platforms",
        endpoint: "platforms",
        fields: "slug, name",
        where: "name != null & slug != null",
        format: (raw) => formatRawPlatform(raw as RawPlatform),
        save: (db, item) => db.platform.upsert({ where: { id: (item as { id: number }).id }, update: item as any, create: item as any }),
    },
    {
        kind: "companies",
        endpoint: "companies",
        fields: "slug, name, logo.image_id, description, developed, published",
        where: "name != null & slug != null",
        format: (raw) => formatRawCompany(raw as RawCompany),
        save: (db, item) => db.company.upsert({ where: { id: (item as { id: number }).id }, update: item as any, create: item as any }),
    },
    {
        kind: "games",
        endpoint: "games",
        fields: "slug, name, summary, total_rating, first_release_date, cover.image_id, screenshots.image_id, videos.video_id, platforms.name, platforms.slug, involved_companies.company, involved_companies.developer, involved_companies.publisher, genres.name, genres.slug, franchises.name, franchises.slug, franchises.games, similar_games, collections.name, collections.slug, collections.games",
        where: "name != null & slug != null",
        format: (raw) => formatRawGame(raw as RawGame),
        save: (db, item) => db.game.upsert({ where: { id: (item as { id: number }).id }, update: item as any, create: item as any }),
    },
];

function requestedKinds(): Set<ImportKind> | null {
    const arg = process.argv.find((value) => value.startsWith("--only="));

    if (!arg) return null;

    return new Set(arg.replace("--only=", "").split(",").map((value) => value.trim()).filter(Boolean) as ImportKind[]);
}

async function main() {
    const [{ getAccessToken }, dbModule] = await Promise.all([
        import("@/lib/token"),
        import("@/lib/db"),
    ]);

    db = dbModule.default;

    const token = await getAccessToken();
    const checkpoint = await readCheckpoint();
    const only = requestedKinds();

    for (const config of importConfigs) {
        if (only && !only.has(config.kind)) continue;

        await importKind(token!, checkpoint, config);
    }
}

main()
    .catch((err) => {
        console.error("Error importing IGDB data:", err);
        process.exit(1);
    })
    .finally(async () => {
        await db?.$disconnect();
    });
