import "server-only";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { logger } from "@/lib/logger";

type Bar = { label: string; value: number };

const propertyId = process.env.GA4_PROPERTY_ID;
const clientEmail = process.env.GA4_CLIENT_EMAIL;
// The key may be stored raw (PEM with literal \n) or base64-encoded; accept both.
const rawKey = process.env.GA4_PRIVATE_KEY;
const privateKey = rawKey ? (rawKey.includes("BEGIN") ? rawKey.replace(/\\n/g, "\n") : Buffer.from(rawKey, "base64").toString("utf8")) : undefined;

const client = globalThis.gaClientGlobal ?? createClient();

const num = (value: string | null | undefined) => Number(value ?? 0) || 0;

const toBars = (rows: { dimensionValues?: ({ value?: string | null } | null)[] | null; metricValues?: ({ value?: string | null } | null)[] | null }[] | null | undefined): Bar[] =>
	(rows ?? []).map((row) => ({ label: row.dimensionValues?.[0]?.value || "?", value: num(row.metricValues?.[0]?.value) }));

declare global {
	// Reuse a single client across dev hot-reloads, mirroring the Prisma/Redis singletons.
	var gaClientGlobal: BetaAnalyticsDataClient | null | undefined;
}

function createClient() {
	if (!propertyId || !clientEmail || !privateKey) return null;
	return new BetaAnalyticsDataClient({ credentials: { client_email: clientEmail, private_key: privateKey } });
}

if (process.env.NODE_ENV !== "production") globalThis.gaClientGlobal = client;

export type GaOverview = {
	configured: boolean;
	// Headline totals over the last 30 days (realtimeUsers is the live 30-minute window).
	realtimeUsers: number;
	activeUsers: number;
	newUsers: number;
	sessions: number;
	pageviews: number;
	engagementRate: number; // percentage, 0-100
	avgEngagementSeconds: number; // per active user
	// Sign-up conversions (the `sign_up` key event we emit on registration).
	signups: number; // total sign_up events, 30 days
	conversionRate: number; // percentage 0-100 — sessions with any key event
	// Daily 30-day series for the trend charts.
	dailyPageviews: Bar[];
	dailyActiveUsers: Bar[];
	dailySignups: Bar[];
	// Top-N breakdowns.
	topPages: Bar[];
	channels: Bar[];
	countries: Bar[];
	devices: Bar[];
};

// A dense 30-day series keyed by GA's compact "YYYYMMDD" date, labelled "MM-DD".
function last30Days() {
	const days: { key: string; label: string }[] = [];
	for (let i = 29; i >= 0; i--) {
		const iso = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
		days.push({ key: iso.replaceAll("-", ""), label: iso.slice(5) });
	}
	return days;
}

export async function getGaOverview(): Promise<GaOverview> {
	const days = last30Days();
	const flatSeries = days.map((d) => ({ label: d.label, value: 0 }));
	const empty: GaOverview = {
		configured: false,
		realtimeUsers: 0,
		activeUsers: 0,
		newUsers: 0,
		sessions: 0,
		pageviews: 0,
		engagementRate: 0,
		avgEngagementSeconds: 0,
		signups: 0,
		conversionRate: 0,
		dailyPageviews: flatSeries,
		dailyActiveUsers: flatSeries,
		dailySignups: flatSeries,
		topPages: [],
		channels: [],
		countries: [],
		devices: [],
	};

	if (!client || !propertyId) return empty;

	const property = `properties/${propertyId}`;
	const dateRanges = [{ startDate: "29daysAgo", endDate: "today" }];

	try {
		const [[totals], [daily], [signupsDaily], [pages], [channels], [countries], [devices], [realtime]] = await Promise.all([
			client.runReport({
				property,
				dateRanges,
				metrics: [
					{ name: "screenPageViews" },
					{ name: "activeUsers" },
					{ name: "newUsers" },
					{ name: "sessions" },
					{ name: "engagementRate" },
					{ name: "userEngagementDuration" },
					{ name: "sessionKeyEventRate" },
				],
			}),
			client.runReport({
				property,
				dateRanges,
				dimensions: [{ name: "date" }],
				metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
				orderBys: [{ dimension: { dimensionName: "date" } }],
			}),
			// Daily sign_up event counts — our registration conversion.
			client.runReport({
				property,
				dateRanges,
				dimensions: [{ name: "date" }],
				metrics: [{ name: "eventCount" }],
				dimensionFilter: { filter: { fieldName: "eventName", stringFilter: { value: "sign_up" } } },
				orderBys: [{ dimension: { dimensionName: "date" } }],
			}),
			client.runReport({
				property,
				dateRanges,
				dimensions: [{ name: "pagePath" }],
				metrics: [{ name: "screenPageViews" }],
				orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
				limit: 8,
			}),
			client.runReport({
				property,
				dateRanges,
				dimensions: [{ name: "sessionDefaultChannelGroup" }],
				metrics: [{ name: "sessions" }],
				orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
				limit: 6,
			}),
			client.runReport({
				property,
				dateRanges,
				dimensions: [{ name: "country" }],
				metrics: [{ name: "activeUsers" }],
				orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
				limit: 6,
			}),
			client.runReport({
				property,
				dateRanges,
				dimensions: [{ name: "deviceCategory" }],
				metrics: [{ name: "sessions" }],
				orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
			}),
			client.runRealtimeReport({ property, metrics: [{ name: "activeUsers" }] }),
		]);

		const total = totals.rows?.[0]?.metricValues;
		const activeUsers = num(total?.[1]?.value);
		const pageviewsByDay = new Map((daily.rows ?? []).map((row) => [row.dimensionValues?.[0]?.value ?? "", num(row.metricValues?.[0]?.value)]));
		const activeByDay = new Map((daily.rows ?? []).map((row) => [row.dimensionValues?.[0]?.value ?? "", num(row.metricValues?.[1]?.value)]));
		const signupsByDay = new Map((signupsDaily.rows ?? []).map((row) => [row.dimensionValues?.[0]?.value ?? "", num(row.metricValues?.[0]?.value)]));
		const dailySignups = days.map((day) => ({ label: day.label, value: signupsByDay.get(day.key) ?? 0 }));

		return {
			configured: true,
			realtimeUsers: num(realtime.rows?.[0]?.metricValues?.[0]?.value),
			activeUsers,
			newUsers: num(total?.[2]?.value),
			sessions: num(total?.[3]?.value),
			pageviews: num(total?.[0]?.value),
			engagementRate: Math.round(num(total?.[4]?.value) * 100),
			avgEngagementSeconds: activeUsers ? Math.round(num(total?.[5]?.value) / activeUsers) : 0,
			signups: dailySignups.reduce((sum, day) => sum + day.value, 0),
			conversionRate: Math.round(num(total?.[6]?.value) * 100),
			dailyPageviews: days.map((day) => ({ label: day.label, value: pageviewsByDay.get(day.key) ?? 0 })),
			dailyActiveUsers: days.map((day) => ({ label: day.label, value: activeByDay.get(day.key) ?? 0 })),
			dailySignups,
			topPages: toBars(pages.rows),
			channels: toBars(channels.rows),
			countries: toBars(countries.rows),
			devices: toBars(devices.rows),
		};
	} catch (error) {
		logger.error("analytics", "Failed to fetch Google Analytics overview", error);
		return empty;
	}
}
