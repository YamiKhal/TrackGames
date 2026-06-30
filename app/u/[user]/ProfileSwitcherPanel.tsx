"use client";

import SubTabs from "@/app/components/layout/SubTabs";
import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";

type ProfileSwitcherPanelProps = Readonly<{ user: string; defaultTab: string; children: ReactNode }>;

export default function ProfileSwitcherPanel({ user, defaultTab, children }: ProfileSwitcherPanelProps) {
	const router = useRouter();

	const tabs = [
		{ id: "profile" as const, label: "Profile" },
		{ id: "activity" as const, label: "Activity" },
		{ id: "playlists" as const, label: "Playlists" },
	];

	function setTab(tab: string) {
		router.push(`/u/${user}?tab=${tab}`);
		setActiveTab(tab);
	}

	const [activeTab, setActiveTab] = useState(defaultTab);

	return (
		<SubTabs tabs={tabs} active={activeTab} setter={setTab} shouldCompact>
			{children}
		</SubTabs>
	);
}
