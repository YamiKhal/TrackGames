import { cookies } from "next/headers";
import "server-only";
import { logger } from "@/lib/logger";

const measurementId = process.env.GA_ID;
const apiSecret = process.env.GA_API_SECRET;

// Fire a GA4 event server-side via the Measurement Protocol. Reuses the client id
// from the visitor's `_ga` cookie so the hit joins the same session/funnel the
// browser's gtag already reports (essential for conversion attribution); falls back
// to a synthetic id when analytics consent hasn't been granted and no cookie exists.
export async function trackServerEvent(name: string, params: Record<string, unknown> = {}) {
	if (!measurementId || !apiSecret) return;

	// `_ga` looks like "GA1.1.<clientId>.<timestamp>"; the client id is the last two segments.
	const ga = (await cookies()).get("_ga")?.value;
	const clientId = ga ? ga.split(".").slice(-2).join(".") : `${Date.now()}.${Math.floor(Math.random() * 1e9)}`;

	try {
		await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`, {
			method: "POST",
			body: JSON.stringify({ client_id: clientId, events: [{ name, params }] }),
		});
	} catch (error) {
		logger.error("analytics", `Failed to send GA event "${name}"`, error);
	}
}
