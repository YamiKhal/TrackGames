"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, User } from "lucide-react";
import { useAdminAction } from "@/app/(admin)/dashboard/_tabs/useAdminAction";
import ConfirmAction from "@/components/ui/ConfirmAction";
import { GhostButton } from "@/components/ui/control/Button";
import { Select } from "@/components/ui/control/Select";
import { deleteFeedback, setFeedbackStatus } from "@/lib/actions/admin/admin";
import { FEEDBACK_TYPE_LABELS } from "@/lib/constants";
import { FeedbackStatus, type FeedbackType } from "@/lib/generated/prisma/enums";
import { joinClass } from "@/lib/util/client/func";

type AdminFeedback = {
	id: string;
	type: FeedbackType;
	page: string | null;
	message: string;
	status: FeedbackStatus;
	createdAt: string | Date;
	user: { id: string; name: string | null } | null;
};

const STATUS_DOTS: Record<FeedbackStatus, string> = {
	NEW: "bg-primary",
	REVIEWED: "bg-success",
	ARCHIVED: "bg-text-faint",
};

export default function FeedbackPanel({ feedback }: Readonly<{ feedback: AdminFeedback[] }>) {
	const [filter, setFilter] = useState<FeedbackStatus | "ALL">("ALL");
	const [confirm, setConfirm] = useState<AdminFeedback | null>(null);
	const { run, pending, error } = useAdminAction();

	const shown = filter === "ALL" ? feedback : feedback.filter((item) => item.status === filter);

	function setStatus(id: string, status: FeedbackStatus) {
		const data = new FormData();
		data.set("feedbackId", id);
		data.set("status", status);
		run(setFeedbackStatus, data);
	}

	function remove() {
		if (!confirm) return;
		const data = new FormData();
		data.set("feedbackId", confirm.id);
		run(deleteFeedback, data, () => setConfirm(null));
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap gap-2">
				{(["ALL", ...Object.values(FeedbackStatus)] as const).map((value) => (
					<button
						key={value}
						type="button"
						onClick={() => setFilter(value)}
						className={joinClass(
							"rounded border px-3 py-1.5 text-xs font-bold transition-colors",
							filter === value ? "border-primary bg-primary/15 text-primary" : "border-border text-text-muted hover:text-text",
						)}
					>
						{value}
					</button>
				))}
			</div>

			{error && <p className="text-sm font-bold text-error">{error}</p>}

			{shown.length === 0 ? (
				<p className="text-sm text-text-muted">No feedback here.</p>
			) : (
				<ul className="flex flex-col gap-2">
					{shown.map((item) => (
						<li key={item.id} className="flex flex-col gap-3 rounded border border-border p-4">
							<div className="flex items-center gap-3">
								<span className={joinClass("size-2 shrink-0 rounded-full", STATUS_DOTS[item.status])} aria-hidden="true" />
								<div className="flex min-w-0 flex-1 flex-col gap-1">
									<span className="text-sm font-semibold text-text">{FEEDBACK_TYPE_LABELS[item.type]}</span>
									<span className="flex items-center gap-1.5 text-xs text-text-faint">
										{item.user?.name ? (
											<Link
												href={`/u/${item.user.name}`}
												target="_blank"
												rel="noreferrer noopener"
												className="flex items-center gap-1 text-text-muted hover:text-primary hover:underline"
											>
												<User size={11} /> {item.user.name}
											</Link>
										) : (
											<span className="text-text-muted">Anonymous</span>
										)}
									</span>
								</div>

								{item.page && (
									<GhostButton variant="text" href={item.page} target="_blank" rel="noopener noreferrer" className="h-10">
										<ExternalLink size={14} />
									</GhostButton>
								)}

								<span className="hidden shrink-0 text-xs text-text-faint sm:block">{new Date(item.createdAt).toLocaleDateString()}</span>
								<div className="flex flex-wrap items-center gap-2">
									<div className="w-44">
										<Select
											aria-label="Change status"
											value={item.status}
											disabled={pending}
											onChange={(event) => {
												if (event.target.value === "DELETE") return setConfirm(item);
												setStatus(item.id, event.target.value as FeedbackStatus);
											}}
										>
											<option value="NEW">
												<span className="flex items-center gap-2">New</span>
											</option>
											<option value="REVIEWED">
												<span className="flex items-center gap-2">Reviewed</span>
											</option>
											<option value="ARCHIVED">
												<span className="flex items-center gap-2">Archived</span>
											</option>
											<option value="DELETE">
												<span className="flex items-center gap-2 text-error">Delete</span>
											</option>
										</Select>
									</div>
								</div>
							</div>

							<p className="text-sm whitespace-pre-wrap text-text-muted">{item.message}</p>
						</li>
					))}
				</ul>
			)}

			<ConfirmAction
				open={Boolean(confirm)}
				title="Delete feedback"
				message="Permanently delete this feedback? This can't be undone."
				confirmLabel="Delete"
				pending={pending}
				error={error}
				onClose={() => setConfirm(null)}
				onConfirm={remove}
			/>
		</div>
	);
}
