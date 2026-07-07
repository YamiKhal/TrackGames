"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink, User } from "lucide-react";
import { useAdminAction } from "@/app/(admin)/dashboard/_tabs/useAdminAction";
import { DangerButton, GhostButton } from "@/components/ui/control/Button";
import { Select } from "@/components/ui/control/Select";
import { TextArea } from "@/components/ui/control/TextArea";
import MenuPanel from "@/components/ui/MenuPanel";
import { deleteCommentAsAdmin, setReportStatus } from "@/lib/actions/admin/admin";
import { REPORT_REASON_LABELS, REPORT_TARGET_LABELS } from "@/lib/constants";
import { type ReportReason, ReportStatus, type ReportTargetType } from "@/lib/generated/prisma/enums";
import { joinClass } from "@/lib/util/client/func";

type AdminReport = {
	id: string;
	targetType: ReportTargetType;
	targetId: string;
	reason: ReportReason;
	details: string | null;
	url: string | null;
	context: unknown;
	status: ReportStatus;
	resolutionNote: string | null;
	createdAt: string | Date;
	reporter: { id: string; name: string | null } | null;
	reportedUser: { id: string; name: string | null } | null;
	handler: { id: string; name: string | null } | null;
};

const STATUS_STYLES: Record<ReportStatus, string> = {
	PENDING: "border-error/40 bg-error/15 text-error",
	HANDLING: "border-secondary/40 bg-secondary/15 text-secondary",
	RESOLVED: "border-success/40 bg-success/15 text-success",
};

const STATUS_DOTS: Record<ReportStatus, string> = {
	PENDING: "bg-error",
	HANDLING: "bg-secondary",
	RESOLVED: "bg-success",
};

export default function ReportsPanel({ reports }: Readonly<{ reports: AdminReport[] }>) {
	const [filter, setFilter] = useState<ReportStatus | "ALL">("ALL");
	const [active, setActive] = useState<AdminReport | null>(null);
	const { run, pending, error } = useAdminAction();

	const shown = filter === "ALL" ? reports : reports.filter((report) => report.status === filter);

	function updateStatus(status: ReportStatus, formData?: FormData) {
		if (!active) return;
		const data = formData ?? new FormData();
		data.set("reportId", active.id);
		data.set("status", status);
		run(setReportStatus, data, () => setActive(null));
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap gap-2">
				{(["ALL", ...Object.values(ReportStatus)] as const).map((value) => (
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

			{shown.length === 0 ? (
				<p className="text-sm text-text-muted">No reports here.</p>
			) : (
				<ul className="flex flex-col gap-2">
					{shown.map((report) => (
						<li key={report.id}>
							<button
								type="button"
								onClick={() => setActive(report)}
								className="group flex w-full cursor-pointer items-center gap-4 rounded border border-border px-4 py-3.5 text-left transition-colors hover:border-border-strong"
							>
								<span className={joinClass("size-2 shrink-0 rounded-full", STATUS_DOTS[report.status])} aria-hidden="true" />
								<span className="flex min-w-0 flex-1 flex-col gap-1">
									<span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
										<span className="text-sm font-semibold text-text">{REPORT_REASON_LABELS[report.reason]}</span>
									</span>
									<span className="flex flex-wrap items-center gap-x-1.5 text-xs text-text-faint">
										<span className="text-text-muted">{report.reporter?.name ?? "deleted"}</span>
										<span aria-hidden="true">on</span>
										<span className="text-text-muted">
											{report.reportedUser?.name ?? "—"}&apos;s {REPORT_TARGET_LABELS[report.targetType]}
										</span>
									</span>
								</span>
								<span className="hidden shrink-0 text-xs text-text-faint sm:block">{new Date(report.createdAt).toLocaleDateString()}</span>
								<span
									className={joinClass(
										"shrink-0 rounded-full border px-2.5 py-0.5 text-[0.65rem] font-bold tracking-wide uppercase",
										STATUS_STYLES[report.status],
									)}
								>
									{report.status}
								</span>
								<ChevronRight size={16} className="shrink-0 text-text-faint transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
							</button>
						</li>
					))}
				</ul>
			)}

			<MenuPanel
				open={Boolean(active)}
				onClose={() => setActive(null)}
				title="Report detail"
				width="34rem"
				formId="report-status-form"
				submitLabel="Update report"
				isSubmitPending={pending}
				footer={
					active?.url && (
						<GhostButton variant="outline" href={active.url} target="_blank" rel="noopener noreferrer">
							<ExternalLink size={14} /> Open
						</GhostButton>
					)
				}
			>
				{active && (
					<div className="flex flex-col gap-4 text-sm">
						<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
							<dt className="font-bold text-text-muted">Target</dt>
							<dd className="text-text-muted">
								{REPORT_TARGET_LABELS[active.targetType]} ({active.targetId})
							</dd>
							<dt className="font-bold text-text-muted">Reason</dt>
							<dd className="text-text-muted">{REPORT_REASON_LABELS[active.reason]}</dd>
							<dt className="font-bold text-text-muted">Reporter</dt>
							<dd>
								<Link href={`/u/${active.reporter?.name}`} target="_blank" rel="noreferrer noopener" className="flex flex-row items-center gap-2 text-text-muted">
									<User size={10} /> {active.reporter?.name ?? "deleted user"}
								</Link>
							</dd>
							<dt className="font-bold text-text-muted">Reported user</dt>
							<dd>
								<Link
									href={`/u/${active.reportedUser?.name}`}
									target="_blank"
									rel="noreferrer noopener"
									className="flex flex-row items-center gap-2 text-text-muted"
								>
									<User size={10} />
									{active.reportedUser?.name ?? "—"}
								</Link>
							</dd>
							{active.details && (
								<>
									<dt className="font-bold text-text-muted">Details</dt>
									<dd className="whitespace-pre-wrap text-text-muted">{active.details}</dd>
								</>
							)}
							{active.handler?.name && (
								<>
									<dt className="font-bold text-text-muted">Handled by</dt>
									<dd className="text-text-muted">{active.handler.name}</dd>
								</>
							)}
						</dl>

						<form id="report-status-form" action={(formData) => updateStatus(formData.get("status") as ReportStatus, formData)} className="flex flex-col gap-3">
							<Select name="status" label="Set status" defaultValue={active.status}>
								{Object.values(ReportStatus).map((status) => (
									<option key={status} value={status}>
										{status}
									</option>
								))}
							</Select>
							<TextArea name="note" label="Resolution note (optional)" rows={2} maxLength={2000} defaultValue={active.resolutionNote ?? ""} />
						</form>

						{active.targetType === "COMMENT" && (
							<DangerButton
								type="button"
								variant="outline"
								disabled={pending}
								onClick={() => {
									const data = new FormData();
									data.set("commentId", active.targetId);
									run(deleteCommentAsAdmin, data, () => setActive(null));
								}}
							>
								Delete comment
							</DangerButton>
						)}

						{error && <p className="font-bold text-error">{error}</p>}
					</div>
				)}
			</MenuPanel>
		</div>
	);
}
