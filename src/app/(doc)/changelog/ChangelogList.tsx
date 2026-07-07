"use client";

import { useState } from "react";
import { ChevronDown, Pin } from "lucide-react";
import { MarkdownBlocks } from "@/components/markdown/MarkdownBlocks";
import { type ChangelogEntry } from "@/lib/data/changelog";
import { joinClass } from "@/lib/util/client/func";
import { parseMarkdownBlocks } from "@/lib/util/parse/markdown";

export default function ChangelogList({ entries }: Readonly<{ entries: ChangelogEntry[] }>) {
	const [open, setOpen] = useState<string | null>(null);

	if (!entries.length) {
		return <p className="rounded border border-border bg-bg-secondary/40 p-6 text-sm text-text-muted">No changelog entries yet. Check back soon.</p>;
	}

	return (
		<div className="flex flex-col gap-3">
			{entries.map((entry) => {
				const expanded = open === entry.id;

				return (
					<article key={entry.id} className={joinClass("overflow-hidden rounded border transition-colors", expanded ? "border-primary/50" : "border-border")}>
						<button
							type="button"
							onClick={() => setOpen(expanded ? null : entry.id)}
							aria-expanded={expanded}
							className="flex w-full cursor-pointer items-center gap-4 bg-bg-secondary/40 p-5 text-left transition-colors hover:bg-bg-secondary/70"
						>
							<div className="flex min-w-0 flex-1 flex-col gap-1">
								<div className="flex flex-wrap items-center gap-2">
									{entry.pinned && <Pin size={14} className="text-primary" aria-label="Pinned" />}
									{new Date(entry.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
									<h2 className="truncate font-bold text-text">{entry.title}</h2>
									{entry.version && <span className="rounded bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">{entry.version}</span>}
								</div>
								<div className="flex items-center gap-2 text-xs text-text-faint">
									{entry.summary && <span className="truncate text-text-muted">{entry.summary}</span>}
								</div>
							</div>
							<ChevronDown size={20} className={joinClass("shrink-0 text-text-muted transition-transform", expanded && "rotate-180")} aria-hidden="true" />
						</button>

						<div
							className={joinClass(
								"grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
								expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
							)}
						>
							<div className="overflow-hidden">
								<div className="flex flex-col gap-4 border-t border-border p-5">
									{entry.content.trim() ? (
										<div className="text-sm leading-6 text-text-muted">
											<MarkdownBlocks blocks={parseMarkdownBlocks(entry.content)} />
										</div>
									) : (
										<p className="text-sm text-text-faint">No details yet.</p>
									)}
								</div>
							</div>
						</div>
					</article>
				);
			})}
		</div>
	);
}
