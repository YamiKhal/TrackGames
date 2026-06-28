import db from "@/lib/db";
import { IGDB_BASE_URL, importConfigs } from "@/lib/external/igdb/import";
import { getAccessToken } from "@/lib/token";
import { after } from "next/server";

export const runtime = "nodejs";

type WebhookParams = {
    params: Promise<{
        kind: string;
        method: string;
    }>;
};

function configFor(kind: string) {
    const normalized = kind === "multiplayer-modes" ? "multiplayerModes" : kind;

    return importConfigs.find((config) => config.kind === normalized || config.endpoint === normalized);
}

function isAuthorized(request: Request, expectedSecret: string) {
    const secret = request.headers.get("x-secret")
        ?? request.headers.get("x-igdb-secret")
        ?? new URL(request.url).searchParams.get("secret");

    return secret === expectedSecret;
}

function isIgdbWebhookBot(request: Request) {
    return request.headers.get("user-agent") === "IGDB-Webhook-Bot";
}

async function fetchWebhookEntity(id: number, config: NonNullable<ReturnType<typeof configFor>>) {
    const token = await getAccessToken();
    const where = [`id = ${id}`, config.where].filter(Boolean).join(" & ");
    const res = await fetch(`${IGDB_BASE_URL}/${config.endpoint}`, {
        method: "POST",
        headers: {
            "Client-ID": process.env.TWITCH_CLIENT_ID!,
            Authorization: `Bearer ${token}`,
        },
        body: `
            fields ${config.fields};
            where ${where};
            limit 1;
        `,
    });

    if (!res.ok) {
        const details = await res.text();
        throw new Error(`[webhook:${config.kind}] IGDB request failed with status ${res.status}: ${details}`);
    }

    const results = await res.json();

    return Array.isArray(results) ? results[0] : null;
}

async function processWebhook(id: number, method: string, config: NonNullable<ReturnType<typeof configFor>>) {
    if (method === "delete") {
        await config.delete(db, id);
        return;
    }

    const raw = await fetchWebhookEntity(id, config);

    if (!raw) return;

    const formatted = config.format(raw);

    await config.save(db, formatted);
}

export async function POST(request: Request, { params }: WebhookParams) {
    const expectedSecret = process.env.IGDB_WEBHOOK_SECRET;

    if (!expectedSecret) {
        return Response.json({ error: "Missing IGDB webhook secret" }, { status: 500 });
    }

    if (!isAuthorized(request, expectedSecret)) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isIgdbWebhookBot(request)) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { kind, method } = await params;
    const config = configFor(kind);

    if (!config) {
        return Response.json({ error: "Unknown IGDB webhook kind" }, { status: 404 });
    }

    const body = await request.json();
    const id = typeof body?.id === "number" ? body.id : null;

    if (!id) {
        return Response.json({ error: "Missing IGDB id" }, { status: 400 });
    }

    if (method !== "create" && method !== "update" && method !== "delete") {
        return Response.json({ error: "Unknown IGDB webhook method" }, { status: 404 });
    }

    after(async () => {
        try {
            await processWebhook(id, method, config);
        } catch (error) {
            console.error(`[webhook:${config.kind}:${method}] Failed to process IGDB id ${id}:`, error);
        }
    });

    return Response.json({ ok: true, accepted: true, kind: config.kind, method, id });
}
