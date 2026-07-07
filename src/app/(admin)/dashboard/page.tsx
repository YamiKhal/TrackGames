import { LogOut } from "lucide-react";
import ChangelogAdminPanel from "@/app/(admin)/dashboard/_tabs/ChangelogAdminPanel";
import FeedbackPanel from "@/app/(admin)/dashboard/_tabs/FeedbackPanel";
import MembersPanel from "@/app/(admin)/dashboard/_tabs/MembersPanel";
import ModerationPanel from "@/app/(admin)/dashboard/_tabs/ModerationPanel";
import OverviewPanel from "@/app/(admin)/dashboard/_tabs/OverviewPanel";
import ReportsPanel from "@/app/(admin)/dashboard/_tabs/ReportsPanel";
import RoadmapAdminPanel from "@/app/(admin)/dashboard/_tabs/RoadmapAdminPanel";
import Tabs from "@/components/layout/Tabs";
import { GhostButton } from "@/components/ui/control/Button";
import { endAdminSession } from "@/lib/actions/admin/admin";
import { requireAdmin } from "@/lib/admin/guard";
import { ADMIN_TABS } from "@/lib/constants";
import { getAllChangelogs, getAllRoadmapItems, getFeedbackList, getReports, searchMembers } from "@/lib/data/admin";
import * as lookup from "@/lib/util/validate/normalize";

type DashboardPageProps = Readonly<{ searchParams: Promise<{ tab?: string; q?: string }> }>;

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
	await requireAdmin();

	const params = await searchParams;
	const activeTab = lookup.value(params.tab, ADMIN_TABS, "id", "overview");
	const query = typeof params.q === "string" ? params.q : "";

	let panel = <OverviewPanel />;
	if (activeTab === "reports") panel = <ReportsPanel reports={await getReports()} />;
	else if (activeTab === "feedback") panel = <FeedbackPanel feedback={await getFeedbackList()} />;
	else if (activeTab === "members") panel = <MembersPanel members={await searchMembers(query)} query={query} />;
	else if (activeTab === "moderation") panel = <ModerationPanel />;
	else if (activeTab === "changelog") panel = <ChangelogAdminPanel entries={await getAllChangelogs()} />;
	else if (activeTab === "roadmap") panel = <RoadmapAdminPanel items={await getAllRoadmapItems()} />;

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
				<div>
					<h1 className="text-2xl font-bold">Admin dashboard</h1>
				</div>
				<form action={endAdminSession}>
					<GhostButton variant="outline" type="submit">
						<LogOut size={16} />
					</GhostButton>
				</form>
			</div>

			<div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
				<Tabs tabs={ADMIN_TABS} active={activeTab} responsive="drawer" drawerTitle="Admin" />
				<div className="min-w-0">{panel}</div>
			</div>
		</div>
	);
}
