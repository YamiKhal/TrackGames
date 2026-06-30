"use client";

import { Bell, ChevronLeft, ChevronRight, Download, LayoutGrid, Settings, Shield, UserIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import HighLevelIsland from "../components/ui/HighLevelIsland";

type SettingsTab = {
	id: string;
	label: string;
};

const _tabs: { id: string; label: string; icon: typeof UserIcon }[] = [
	{ id: "profile", label: "Profile", icon: UserIcon },
	{ id: "privacy", label: "Privacy", icon: Shield },
	{ id: "widgets", label: "Widgets", icon: LayoutGrid },
	{ id: "preferences", label: "Preferences", icon: Bell },
	{ id: "import", label: "Import", icon: Download },
	{ id: "account", label: "Account", icon: Settings },
];

export default function SettingsTabs({ tabs, activeTab }: Readonly<{ tabs: SettingsTab[]; activeTab: string }>) {
	const [open, setOpen] = useState(false);
	const [rendered, setRendered] = useState(false);
	const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

	useEffect(() => {
		if (!open) return;

		const frame = globalThis.requestAnimationFrame(() => setRendered(true));
		return () => globalThis.cancelAnimationFrame(frame);
	}, [open]);

	useEffect(() => {
		if (!rendered) return;

		function closeOnEscape(event: KeyboardEvent) {
			if (event.key === "Escape") setOpen(false);
		}

		document.addEventListener("keydown", closeOnEscape);
		return () => document.removeEventListener("keydown", closeOnEscape);
	}, [rendered]);

	return (
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

			{rendered && (
				<HighLevelIsland className="lg:hidden">
					<dialog
						className={`pointer-events-auto fixed inset-0 bg-overlay ${open ? "animate-menu-overlay-in" : "animate-menu-overlay-out"}`}
						onPointerDown={(event) => {
							if (event.target === event.currentTarget) setOpen(false);
						}}
					>
						<div
							role="menu"
							onAnimationEnd={() => {
								if (!open) setRendered(false);
							}}
							className={`fixed top-0 bottom-0 left-0 flex w-[min(20rem,calc(100vw-2rem))] flex-col border-r border-border bg-bg p-3 shadow-main ${open ? "animate-menu-drawer-left-in" : "animate-menu-drawer-left-out"}`}
						>
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
								{tabs.map((tab) => {
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
						</div>
					</dialog>
				</HighLevelIsland>
			)}
		</div>
	);
}
