"use client";

import { ArrowRight } from "lucide-react";
import { Dispatch, ReactNode, SetStateAction } from "react";

type SubTabsProps = Readonly<{
	tabs: { id: string; label: string }[];
	active: string;
	setter: Dispatch<SetStateAction<string>> | ((tab: string) => void);
	hasViewAll?: boolean;
	viewAllHref?: string;
	shouldCompact?: boolean;
	children?: ReactNode;
}>;

export default function SubTabs({ tabs, active, setter, hasViewAll, shouldCompact, children }: SubTabsProps) {
	if (!tabs.length) {
		return null;
	}

	return (
		<div className="min-w-0">
			{shouldCompact && (
				<div className="mb-5 flex min-w-0 items-center gap-2 md:hidden">
					<nav className="flex min-w-0 flex-1 gap-1 overflow-hidden p-1" aria-label="Tabs">
						{tabs.map((tab) => {
							const isActive = tab.id === active;

							return (
								<button
									key={tab.id}
									type="button"
									onClick={() => setter(tab.id)}
									className={`max-w-28 min-w-0 shrink-0 rounded px-2 py-2 text-xs font-bold transition ${isActive ? "bg-primary text-text-inverse" : "border border-border bg-bg-secondary/50 text-text-muted hover:text-text"}`}
									aria-pressed={isActive}
								>
									<span className="block truncate">{tab.label}</span>
								</button>
							);
						})}
					</nav>
					{hasViewAll && (
						<button
							type="button"
							className="group flex shrink-0 cursor-pointer items-center border-b border-border px-2 py-2 text-xs font-bold text-text-muted transition-colors hover:text-text"
						>
							View all
						</button>
					)}
				</div>
			)}

			<nav className={`mb-5 min-w-0 flex-row items-center gap-2 border-b border-border ${shouldCompact ? "hidden md:flex" : "flex"}`} aria-label="Tabs">
				{tabs.map((tab) => {
					const isActive = tab.id === active;

					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => setter(tab.id)}
							className={`rounded-t border-b-2 px-4 py-3 text-xl font-bold transition-colors ${
								isActive
									? "border-primary bg-linear-to-b from-transparent to-primary/25 bg-no-repeat text-text"
									: "border-transparent text-text-muted hover:bg-bg-secondary/60 hover:text-text"
							}`}
							aria-pressed={isActive}
						>
							{tab.label}
						</button>
					);
				})}
				{hasViewAll && (
					<button
						type="button"
						className="group ml-auto flex shrink-0 cursor-pointer items-center gap-2 px-1 py-2 text-sm font-bold text-text-muted transition-colors hover:text-text"
					>
						<span>View all</span>
						<span className="grid size-7 place-items-center rounded-2xl border border-border bg-bg-secondary text-text-muted transition-colors group-hover:border-primary/50 group-hover:text-primary">
							<ArrowRight size={14} />
						</span>
					</button>
				)}
			</nav>

			{children}
		</div>
	);
}
