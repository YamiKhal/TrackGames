import { IGDB_BASE_URL, importConfigs } from "@/lib/external/igdb/import";
import { getAccessToken } from "@/lib/token";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const methods = ["create", "update", "delete"];

function webhookKind(kind: string) {
    return kind === "multiplayerModes" ? "multiplayer-modes" : kind;
}

async function registerWebhook(token: string, endpoint: string, url: string, method: string, secret: string) {
    const body = new URLSearchParams({
        url,
        method,
        secret,
    });

    const res = await fetch(`${IGDB_BASE_URL}/${endpoint}/webhooks/`, {
        method: "POST",
        headers: {
            "Client-ID": process.env.TWITCH_CLIENT_ID!,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
    });

    if (!res.ok) {
        const details = await res.text();
        throw new Error(`[${endpoint}:${method}] Webhook registration failed with status ${res.status}: ${details}`);
    }

    return res.json();
}

async function main() {
    const baseUrl = process.env.IGDB_WEBHOOK_BASE_URL?.replace(/\/$/, "");
    const secret = process.env.IGDB_WEBHOOK_SECRET;

    if (!baseUrl) {
        throw new Error("Missing IGDB_WEBHOOK_BASE_URL.");
    }

    if (!secret) {
        throw new Error("Missing IGDB_WEBHOOK_SECRET.");
    }

    const token = await getAccessToken();

    for (const config of importConfigs) {
        for (const method of methods) {
            const url = `${baseUrl}/webhooks/${webhookKind(config.kind)}/${method}`;
            const webhook = await registerWebhook(token, config.endpoint, url, method, secret);

            console.log(`[${config.kind}:${method}] Registered ${url}`);
            console.log(webhook);
        }
    }
}

main().catch((err) => {
    console.error("Error registering IGDB webhooks:", err);
    process.exit(1);
});
