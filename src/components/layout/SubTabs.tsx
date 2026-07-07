"use client";

import { useState } from "react";
import Tabs, { type Tab } from "@/components/layout/Tabs";

export default function SubTabs({ tabs, panels }: Readonly<{ tabs: Tab[]; panels: React.ReactNode[] }>) {
	const [active, setActive] = useState(tabs[0]?.id);
	const index = Math.max(
		0,
		tabs.findIndex((tab) => tab.id === active),
	);

	return (
		<Tabs tabs={tabs} active={active} onSelect={setActive}>
			{panels[index]}
		</Tabs>
	);
}
