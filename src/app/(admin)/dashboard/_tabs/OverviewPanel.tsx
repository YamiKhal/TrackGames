import { Eye, Flag, Heart, HeartHandshake, MessageSquare, ScrollText } from "lucide-react";
import FlashDot from "@/app/(admin)/dashboard/_tabs/FlashDot";
import { BarChart, LineChart } from "@/app/(admin)/dashboard/_tabs/MiniChart";
import { GhostButton } from "@/components/ui/control/Button";
import { getAdminOverview } from "@/lib/data/admin";
import { formatNumber } from "@/lib/util/format/numbers";

export default async function OverviewPanel() {
	const overview = await getAdminOverview();

	const tiles = [
		{ label: "Open reports", value: overview.openReports, icon: Flag, flash: overview.openReports > 0 },
		{ label: "New feedback", value: overview.newFeedback, icon: MessageSquare, flash: overview.newFeedback > 0 },
		{ label: "Total likes", value: overview.totalLikes, icon: Heart },
		{ label: "Active backers", value: overview.activeBackers, icon: HeartHandshake },
		{ label: "Logs (30 days)", value: overview.logs30d, icon: ScrollText },
		{ label: "Pageviews", value: overview.totalPageviews, icon: Eye },
	];

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
				{tiles.map((tile) => (
					<div key={tile.label} className="relative flex flex-col gap-1 rounded bg-bg-secondary/40 p-4">
						{tile.flash && <FlashDot className="absolute top-2 right-2" />}
						<tile.icon size={18} className="text-primary" aria-hidden="true" />
						<span className="text-2xl font-bold text-text tabular-nums" title={tile.value.toLocaleString()}>
							{formatNumber(tile.value)}
						</span>
						<span className="text-xs text-text-muted">{tile.label}</span>
					</div>
				))}
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<ChartCard title="Daily pageviews (30 days)">
					<LineChart data={overview.dailyPageviews} />
				</ChartCard>
				<ChartCard title="New signups (30 days)">
					<LineChart data={overview.signups} />
				</ChartCard>
				<ChartCard title="Play logs (30 days)">
					<LineChart data={overview.logs} />
				</ChartCard>
				<ChartCard title="Comments (30 days)">
					<LineChart data={overview.comments} />
				</ChartCard>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<ChartCard title="Top pages">
					<BarChart data={overview.topPages} />
				</ChartCard>
				<ChartCard title="Top logged games">
					<BarChart data={overview.topGames} />
				</ChartCard>
			</div>

			<ChartCard title="Recent comments">
				{overview.recentComments.length === 0 ? (
					<p className="text-sm text-text-faint">No comments yet.</p>
				) : (
					<ul className="flex flex-col divide-y divide-border">
						{overview.recentComments.map((comment) => (
							<li key={comment.id} className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm">
								<span className="flex min-w-0 flex-row items-center gap-2">
									<span className="text-text-muted">By</span>
									{comment.author ? (
										<GhostButton
											variant="text"
											href={`/u/${comment.author}?tab=profile`}
											target="_blank"
											rel="noreferrer noopener"
											className="font-bold text-text-muted hover:text-primary"
										>
											{comment.author}
										</GhostButton>
									) : (
										"Unknown - "
									)}
									<span className="line-clamp-1 text-text-muted">{comment.content}</span>
								</span>
								<div className="flex flex-row items-center gap-3">
									{comment.href && (
										<>
											<GhostButton variant="text" href={comment.href} target="_blank" rel="noreferrer noopener" className="hover:text-primary">
												View comment
											</GhostButton>
										</>
									)}
									<span className="shrink-0 text-xs text-text-faint">{new Date(comment.createdAt).toLocaleDateString()}</span>
								</div>
							</li>
						))}
					</ul>
				)}
			</ChartCard>
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
