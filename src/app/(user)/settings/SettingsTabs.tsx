"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, ChevronLeft, ChevronRight, Download, LayoutGrid, Settings, Shield, UserIcon } from "lucide-react";
import MenuPanel from "@/components/ui/MenuPanel";

const _tabs: { id: string; label: string; icon: typeof UserIcon }[] = [
	{ id: "profile", label: "Profile", icon: UserIcon },
	{ id: "privacy", label: "Privacy", icon: Shield },
	{ id: "widgets", label: "Widgets", icon: LayoutGrid },
	{ id: "preferences", label: "Preferences", icon: Bell },
	{ id: "import", label: "Import", icon: Download },
	{ id: "account", label: "Account", icon: Settings },
];

export default function SettingsTabs({ activeTab }: Readonly<{ activeTab: string }>) {
	const [open, setOpen] = useState(false);
	const active = _tabs.find((tab) => tab.id === activeTab) ?? _tabs[0];

	return (
		<>
			<div className="lg:hidden">
				<button
					type="button"
					onClick={() => setOpen(true)}
					className="mb-5 flex w-full min-w-0 items-center justify-between gap-3 border-b border-border bg-bg-secondary px-4 py-3 text-left transition-colors hover:text-primary"
					aria-haspopup="menu"
					aria-expanded={open}
				>
					<span className="min-w-0">
						<span className="block truncate text-lg font-bold text-text">{active.label}</span>
					</span>
					<ChevronRight size={18} className="shrink-0" aria-hidden="true" />
				</button>

				<MenuPanel open={open} onClose={() => setOpen(false)} variant="drawer-left" width="20rem" role="menu" shouldShowClose={false} panelClassName="flex flex-col p-3">
					<div className="mb-2 flex flex-row items-center border-b border-border pb-5">
						<button
							type="button"
							onClick={() => setOpen(false)}
							className="grid size-8 cursor-pointer place-items-center rounded text-text-muted hover:text-primary"
							aria-label="Close settings tabs"
						>
							<ChevronLeft size={20} strokeWidth={3} aria-hidden="true" />
						</button>
						<p className="w-full text-center font-bold">Settings</p>
					</div>
					<nav className="flex flex-col gap-1" aria-label="Settings tabs">
						{_tabs.map((tab) => {
							const selected = tab.id === activeTab;
							const Icon = _tabs.find((e) => e.id === tab.id)!.icon;

							return (
								<Link
									key={tab.id}
									href={`/settings?tab=${tab.id}`}
									onClick={() => setOpen(false)}
									className={`flex flex-row gap-5 border-l-2 px-4 py-3 text-left transition-colors ${
										selected
											? "border-primary bg-linear-to-r from-primary/25 to-transparent bg-no-repeat text-text"
											: "border-transparent text-text-muted hover:bg-bg-secondary/60 hover:text-text"
									}`}
									role="menuitem"
									aria-current={selected ? "page" : undefined}
								>
									<Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
									<span className="block text-lg font-bold">{tab.label}</span>
								</Link>
							);
						})}
					</nav>
				</MenuPanel>
			</div>
			<aside className="hidden border-r border-border lg:block">
				<nav className="flex flex-col">
					{_tabs.map((tab) => {
						const Icon = tab.icon;
						const selected = tab.id === activeTab;

						return (
							<Link
								key={tab.id}
								href={`/settings?tab=${tab.id}`}
								className={`flex min-w-56 items-start gap-3 border-b border-border p-5 text-left transition-colors lg:min-w-0 ${selected ? "bg-surface text-text" : "text-text-muted hover:bg-surface hover:text-text"}`}
							>
								<Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
								<span className="min-w-0">
									<span className="text-md block font-bold">{tab.label}</span>
								</span>
							</Link>
						);
					})}
				</nav>
			</aside>
		</>
	);
}
