"use client";

import { Activity, Eye, Flag, ListMusic, MessageSquare, MousePointerClick, ScrollText, UserPlus, Users } from "lucide-react";
import FlashDot from "@/app/(admin)/dashboard/_components/FlashDot";
import { BarChart, DonutChart, LineChart, RadialGauge } from "@/app/(admin)/dashboard/_components/MiniChart";
import type { AdminOverview } from "@/lib/data/admin";
import { formatNumber } from "@/lib/util/format/numbers";

export function AudienceTab({ overview }: Readonly<{ overview: AdminOverview }>) {
	const { ga } = overview;

	const tiles = [
		{ label: "Live now", value: formatNumber(ga.realtimeUsers), icon: Activity },
		{ label: "Active users (30d)", value: formatNumber(ga.activeUsers), icon: Users },
		{ label: "New users (30d)", value: formatNumber(ga.newUsers), icon: UserPlus },
		{ label: "Sessions (30d)", value: formatNumber(ga.sessions), icon: MousePointerClick },
		{ label: "Pageviews (30d)", value: formatNumber(ga.pageviews), icon: Eye },
		{ label: "Sign-ups (30d)", value: formatNumber(ga.signups), icon: UserPlus },
	];

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
				{tiles.map((tile) => (
					<StatTile key={tile.label} {...tile} />
				))}
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<ChartCard title="Daily active users (30 days)">
					<LineChart data={ga.dailyActiveUsers} />
				</ChartCard>
				<ChartCard title="Daily pageviews (30 days)">
					<LineChart data={ga.dailyPageviews} />
				</ChartCard>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<ChartCard title="Daily sign-ups (30 days)">
					<LineChart data={ga.dailySignups} />
				</ChartCard>
				<ChartCard title="Sign-up conversion rate">
					<div className="flex justify-center py-2">
						<RadialGauge value={ga.conversionRate} caption={`${formatNumber(ga.signups)} sign-ups / 30d`} />
					</div>
				</ChartCard>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<ChartCard title="Engagement rate">
					<div className="flex justify-center py-2">
						<RadialGauge value={ga.engagementRate} caption={`${formatNumber(ga.avgEngagementSeconds)}s avg / user`} />
					</div>
				</ChartCard>
				<ChartCard title="Devices">
					<DonutChart data={ga.devices} />
				</ChartCard>
				<ChartCard title="Traffic channels">
					<DonutChart data={ga.channels} />
				</ChartCard>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<ChartCard title="Top pages">
					<BarChart data={ga.topPages} />
				</ChartCard>
				<ChartCard title="Top countries">
					<BarChart data={ga.countries} />
				</ChartCard>
			</div>

			{!ga.configured && (
				<p className="rounded bg-bg-secondary/40 px-4 py-3 text-xs text-text-faint">
					Google Analytics is not configured — traffic and audience metrics show zero. Set <span className="font-mono">GA4_PROPERTY_ID</span>,{" "}
					<span className="font-mono">GA4_CLIENT_EMAIL</span> and <span className="font-mono">GA4_PRIVATE_KEY</span> to enable them.
				</p>
			)}
		</div>
	);
}

export function CommunityTab({ overview }: Readonly<{ overview: AdminOverview }>) {
	const tiles = [
		{ label: "Open reports", value: formatNumber(overview.openReports), icon: Flag, flash: overview.openReports > 0 },
		{ label: "New feedback", value: formatNumber(overview.newFeedback), icon: MessageSquare, flash: overview.newFeedback > 0 },
		{ label: "Members", value: formatNumber(overview.totalMembers), icon: Users },
		{ label: "Comments", value: formatNumber(overview.totalComments), icon: MessageSquare },
		{ label: "Playlists", value: formatNumber(overview.totalPlaylists), icon: ListMusic },
		{ label: "Play logs", value: formatNumber(overview.totalLogs), icon: ScrollText },
	];

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
				{tiles.map((tile) => (
					<StatTile key={tile.label} {...tile} />
				))}
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<ChartCard title="Play logs (30 days)">
					<LineChart data={overview.logs} />
				</ChartCard>
				<ChartCard title="Roadmap shipped">
					<div className="flex justify-center py-2">
						<RadialGauge value={overview.roadmap.pct} caption={`${overview.roadmap.shipped} of ${overview.roadmap.total} items shipped`} />
					</div>
				</ChartCard>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<ChartCard title="Feedback types">
					<DonutChart data={overview.feedbackTypes} />
				</ChartCard>
				<ChartCard title="Activity mix (30 days)">
					<BarChart data={overview.activityMix} />
				</ChartCard>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<ChartCard title="Most active members">
					<BarChart data={overview.mostActive} />
				</ChartCard>
				<ChartCard title="Most followed members">
					<BarChart data={overview.topFollowed} />
				</ChartCard>
			</div>
		</div>
	);
}

function StatTile({ label, value, icon: Icon, flash }: Readonly<{ label: string; value: string; icon: typeof Flag; flash?: boolean }>) {
	return (
		<div className="relative flex flex-col gap-1 rounded bg-bg-secondary/40 p-4">
			{flash && <FlashDot className="absolute top-2 right-2" />}
			<Icon size={18} className="text-primary" aria-hidden="true" />
			<span className="text-2xl font-bold text-text tabular-nums">{value}</span>
			<span className="text-xs text-text-muted">{label}</span>
		</div>
	);
}

function ChartCard({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
	return (
		<div className="rounded bg-bg-secondary/40 p-5">
			<h3 className="mb-3 text-sm font-bold text-text-muted">{title}</h3>
			{children}
		</div>
	);
}
