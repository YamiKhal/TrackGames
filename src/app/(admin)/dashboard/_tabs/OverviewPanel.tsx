import { Suspense } from "react";
import { AudienceTab, CommunityTab } from "@/app/(admin)/dashboard/_components/OverviewTabs";
import SubTabs from "@/components/layout/SubTabs";
import Loading from "@/components/ui/Loading";
import { getAdminOverview } from "@/lib/data/admin";

export default function OverviewPanel() {
	return (
		<Suspense fallback={<Loading />}>
			<OverviewContent />
		</Suspense>
	);
}

async function OverviewContent() {
	const overview = await getAdminOverview();

	return (
		<SubTabs
			tabs={[
				{ id: "community", label: "Community" },
				{ id: "audience", label: "Audience" },
			]}
			panels={[<CommunityTab key="community" overview={overview} />, <AudienceTab key="audience" overview={overview} />]}
		/>
	);
}
