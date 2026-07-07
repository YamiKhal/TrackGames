"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { GhostButton } from "@/components/ui/control/Button";
import { Select } from "@/components/ui/control/Select";
import { TextArea } from "@/components/ui/control/TextArea";
import MenuPanel from "@/components/ui/MenuPanel";
import { submitReport } from "@/lib/actions/social/report";
import { REPORT_REASON_LABELS } from "@/lib/constants";
import { type ReportTargetType } from "@/lib/generated/prisma/enums";
import { joinClass } from "@/lib/util/client/func";

type ReportButtonProps = Readonly<{
	targetType: ReportTargetType;
	targetId: string;
	reportedUserId?: string | null;
	/** Extra data attached to the report so admins have context (title, excerpt, etc.). */
	context?: Record<string, string>;
	/** Optional hash appended to the captured URL, e.g. `comment-<id>`. */
	anchor?: string;
	label?: string;
	className?: string;
	/** "link" = subtle inline flag+label (default). "button" = icon-only outline button for headers. */
	display?: "link" | "button";
}>;

export default function ReportButton({ targetType, targetId, reportedUserId, context, anchor, label = "Report", className, display = "link" }: ReportButtonProps) {
	const [open, setOpen] = useState(false);
	const [error, setError] = useState("");
	const [done, setDone] = useState(false);
	const [pending, startTransition] = useTransition();

	function close() {
		setOpen(false);
		// Reset a moment later so the closing animation doesn't flash the reset state.
		globalThis.setTimeout(() => {
			setError("");
			setDone(false);
		}, 200);
	}

	function handleSubmit(formData: FormData) {
		setError("");
		formData.set("url", `${globalThis.location.origin}${globalThis.location.pathname}${anchor ? `#${anchor}` : ""}`);
		startTransition(async () => {
			const response = await submitReport(formData);
			if (response?.error) {
				setError(response.error);
				return;
			}
			setDone(true);
		});
	}

	return (
		<>
			{display === "button" ? (
				<GhostButton variant="outline" type="button" onClick={() => setOpen(true)} aria-label={label} className={className}>
					<Flag size={16} aria-hidden="true" />
				</GhostButton>
			) : (
				<button
					type="button"
					onClick={() => setOpen(true)}
					className={joinClass("flex items-center gap-1.5 text-xs font-bold text-text-faint transition-colors hover:text-error", className)}
				>
					<Flag size={14} aria-hidden="true" />
					{label}
				</button>
			)}

			<MenuPanel
				open={open}
				onClose={close}
				title="Report content"
				width="30rem"
				formId={done ? undefined : "report-form"}
				submitLabel={done ? undefined : "Submit report"}
				isSubmitPending={pending}
				closeLabel={done ? "Done" : "Cancel"}
			>
				{done ? (
					<p className="text-sm text-text-muted">Thanks — your report has been received. Our team will review it.</p>
				) : (
					<form id="report-form" action={handleSubmit} className="flex flex-col gap-4">
						<input type="hidden" name="targetType" value={targetType} />
						<input type="hidden" name="targetId" value={targetId} />
						{reportedUserId && <input type="hidden" name="reportedUserId" value={reportedUserId} />}
						{context && <input type="hidden" name="context" value={JSON.stringify(context)} />}

						<Select name="reason" label="Reason" defaultValue="SPAM">
							{Object.entries(REPORT_REASON_LABELS).map(([value, text]) => (
								<option key={value} value={value}>
									{text}
								</option>
							))}
						</Select>

						<TextArea name="details" label="Details (optional)" rows={4} maxLength={2000} placeholder="Add anything that helps us understand the problem." />

						{error && <p className="text-sm font-bold text-error">{error}</p>}
					</form>
				)}
			</MenuPanel>
		</>
	);
}
