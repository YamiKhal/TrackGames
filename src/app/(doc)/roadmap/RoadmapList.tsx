"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown, ThumbsUp } from "lucide-react";
import { MarkdownBlocks } from "@/components/markdown/MarkdownBlocks";
import { toggleRoadmapVote } from "@/lib/actions/social/roadmap";
import { type RoadmapItemView } from "@/lib/data/roadmap";
import { type RoadmapStatus } from "@/lib/generated/prisma/enums";
import { joinClass } from "@/lib/util/client/func";
import { parseMarkdownBlocks } from "@/lib/util/parse/markdown";

const statusMeta: Record<RoadmapStatus, { label: string; className: string }> = {
	CONSIDERING: { label: "Considering", className: "bg-text-faint/15 text-text-muted" },
	PLANNED: { label: "Planned", className: "bg-primary/15 text-primary" },
	IN_PROGRESS: { label: "In progress", className: "bg-secondary/15 text-secondary" },
	SHIPPED: { label: "Shipped", className: "bg-success/15 text-success" },
};

export default function RoadmapList({ items: initial, isLoggedIn }: Readonly<{ items: RoadmapItemView[]; isLoggedIn: boolean }>) {
	const [items, setItems] = useState(initial);
	const [openId, setOpenId] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	if (!items.length) {
		return <p className="rounded border border-border bg-bg-secondary/40 p-6 text-sm text-text-muted">Nothing on the roadmap yet. Check back soon.</p>;
	}

	function toggle(id: string, hasVoted: boolean) {
		const delta = hasVoted ? -1 : 1;
		setItems((prev) => prev.map((item) => (item.id === id ? { ...item, hasVoted: !hasVoted, voteCount: item.voteCount + delta } : item)));

		startTransition(async () => {
			const result = await toggleRoadmapVote(id);

			if (!result || "error" in result) {
				// revert the optimistic change on failure
				setItems((prev) => prev.map((item) => (item.id === id ? { ...item, hasVoted, voteCount: item.voteCount - delta } : item)));
				return;
			}

			setItems((prev) => prev.map((item) => (item.id === id ? { ...item, hasVoted: result.voted, voteCount: result.voteCount } : item)));
		});
	}

	return (
		<div className="flex flex-col gap-3">
			{items.map((item) => {
				const expanded = openId === item.id;
				const status = statusMeta[item.status];

				return (
					<article key={item.id} className={joinClass("overflow-hidden rounded border transition-colors", expanded ? "border-primary/50" : "border-border")}>
						<div className="flex items-stretch bg-bg-secondary/40">
							{isLoggedIn ? (
								<button
									type="button"
									onClick={() => toggle(item.id, item.hasVoted)}
									disabled={pending}
									aria-pressed={item.hasVoted}
									aria-label={item.hasVoted ? "Remove your vote" : "Vote for this"}
									className={joinClass(
										"flex w-16 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 border-r border-border transition-colors disabled:opacity-60",
										item.hasVoted ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-bg-secondary/70 hover:text-text",
									)}
								>
									<ThumbsUp size={18} className={item.hasVoted ? "fill-current" : undefined} aria-hidden="true" />
									<span className="text-sm font-bold">{item.voteCount}</span>
								</button>
							) : (
								<Link
									href="/login"
									aria-label="Log in to vote"
									className="flex w-16 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 border-r border-border text-text-muted transition-colors hover:bg-bg-secondary/70 hover:text-text"
								>
									<ThumbsUp size={18} aria-hidden="true" />
									<span className="text-sm font-bold">{item.voteCount}</span>
								</Link>
							)}

							<button
								type="button"
								onClick={() => setOpenId(expanded ? null : item.id)}
								aria-expanded={expanded}
								className="flex min-w-0 flex-1 cursor-pointer items-center gap-4 p-5 text-left transition-colors hover:bg-bg-secondary/70"
							>
								<div className="flex min-w-0 flex-1 flex-col gap-1">
									<div className="flex flex-wrap items-center gap-2">
										<h2 className="truncate font-bold text-text">{item.title}</h2>
										<span className={joinClass("rounded px-2 py-0.5 text-xs font-bold", status.className)}>{status.label}</span>
									</div>
									{item.summary && <p className={joinClass("text-sm text-text-muted", !expanded && "truncate")}>{item.summary}</p>}
								</div>
								<ChevronDown size={20} className={joinClass("shrink-0 text-text-muted transition-transform", expanded && "rotate-180")} aria-hidden="true" />
							</button>
						</div>

						<div
							className={joinClass(
								"grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
								expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
							)}
						>
							<div className="overflow-hidden">
								<div className="border-t border-border p-5 text-sm leading-6 text-text-muted">
									{item.content.trim() ? <MarkdownBlocks blocks={parseMarkdownBlocks(item.content)} /> : <p className="text-text-faint">No details yet.</p>}
								</div>
							</div>
						</div>
					</article>
				);
			})}
		</div>
	);
}
