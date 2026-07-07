"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useAdminAction } from "@/app/(admin)/dashboard/_tabs/useAdminAction";
import MarkdownWidgetEditor from "@/app/(user)/settings/MarkdownWidgetEditor";
import ConfirmAction from "@/components/ui/ConfirmAction";
import { DangerButton, GhostButton, PrimaryButton } from "@/components/ui/control/Button";
import { Checkbox } from "@/components/ui/control/Checkbox";
import { Select } from "@/components/ui/control/Select";
import { TextArea } from "@/components/ui/control/TextArea";
import { TextInput } from "@/components/ui/control/TextInput";
import MenuPanel from "@/components/ui/MenuPanel";
import { createRoadmapItem, deleteRoadmapItem, updateRoadmapItem } from "@/lib/actions/admin/adminDocs";
import { RoadmapStatus } from "@/lib/generated/prisma/enums";
import { joinClass } from "@/lib/util/client/func";

type AdminRoadmapItem = {
	id: string;
	slug: string;
	title: string;
	summary: string | null;
	status: RoadmapStatus;
	position: number;
	public: boolean;
	content: string;
	voteCount: number;
};

export default function RoadmapAdminPanel({ items }: Readonly<{ items: AdminRoadmapItem[] }>) {
	const [editing, setEditing] = useState<AdminRoadmapItem | "new" | null>(null);
	const [content, setContent] = useState("");
	const [confirm, setConfirm] = useState<AdminRoadmapItem | null>(null);
	const { run, pending, error } = useAdminAction();

	const current = editing === "new" ? null : editing;

	function open(item: AdminRoadmapItem | "new") {
		setEditing(item);
		setContent(item === "new" ? "" : item.content);
	}

	function submit(formData: FormData) {
		formData.set("content", content);
		if (current) formData.set("id", current.id);
		run(current ? updateRoadmapItem : createRoadmapItem, formData, () => setEditing(null));
	}

	function remove() {
		if (!confirm) return;
		const data = new FormData();
		data.set("id", confirm.id);
		run(deleteRoadmapItem, data, () => setConfirm(null));
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-end">
				<PrimaryButton type="button" onClick={() => open("new")}>
					<Plus size={16} /> New item
				</PrimaryButton>
			</div>

			{items.length === 0 ? (
				<p className="text-sm text-text-muted">No roadmap items yet.</p>
			) : (
				<ul className="flex flex-col gap-2">
					{items.map((item) => (
						<li
							key={item.id}
							className="flex cursor-pointer flex-col gap-3 rounded border border-border p-4 transition-colors hover:border-primary/40 sm:flex-row sm:items-center"
						>
							<span className={joinClass("size-2 shrink-0 rounded-full", item.public ? "bg-success" : "bg-text-faint")} aria-hidden="true" />
							<div className="flex min-w-0 flex-1 flex-col gap-1">
								<span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-text">
									{item.title}
									<span className="rounded border border-border px-1.5 py-0.5 text-[0.6rem] font-bold text-text-muted">{item.status}</span>
									{!item.public && <span className="rounded border border-border px-1.5 py-0.5 text-[0.6rem] font-bold text-text-muted">HIDDEN</span>}
								</span>
								<span className="text-xs text-text-faint">{item.voteCount} votes</span>
							</div>
							<div className="flex shrink-0 gap-1">
								<GhostButton variant="text" type="button" onClick={() => open(item)} className="px-3 py-2">
									Edit
								</GhostButton>
								<DangerButton variant="text" type="button" onClick={() => setConfirm(item)} className="px-3 py-2">
									Delete
								</DangerButton>
							</div>
						</li>
					))}
				</ul>
			)}

			<MenuPanel open={Boolean(editing)} onClose={() => setEditing(null)} title={current ? "Edit item" : "New roadmap item"} width="42rem" shouldShowClose={false}>
				{editing && (
					<form action={submit} className="flex flex-col gap-4">
						<TextInput name="title" label="Title" defaultValue={current?.title ?? ""} required maxLength={200} />
						<div className="grid gap-3 sm:grid-cols-2">
							<TextInput name="slug" label="Slug (optional)" defaultValue={current?.slug ?? ""} placeholder="auto from title" maxLength={200} />
							<TextInput name="position" type="number" label="Position" defaultValue={String(current?.position ?? 0)} min={0} />
						</div>
						<TextArea name="summary" label="Summary (optional)" rows={2} maxLength={2000} defaultValue={current?.summary ?? ""} />
						<div className="grid items-end gap-3 sm:grid-cols-2">
							<Select name="status" label="Status" defaultValue={current?.status ?? RoadmapStatus.PLANNED}>
								{Object.values(RoadmapStatus).map((status) => (
									<option key={status} value={status}>
										{status}
									</option>
								))}
							</Select>
							<Checkbox name="public" label="Public" defaultChecked={current?.public ?? true} fieldClassName="pb-2" />
						</div>

						<div className="flex flex-col gap-2">
							<span className="text-sm font-bold text-text-muted">Content (Markdown)</span>
							<MarkdownWidgetEditor value={content} onChange={setContent} />
						</div>

						{error && <p className="text-sm font-bold text-error">{error}</p>}
						<div className="flex justify-end gap-2">
							<GhostButton variant="outline" type="button" onClick={() => setEditing(null)}>
								Cancel
							</GhostButton>
							<PrimaryButton type="submit" disabled={pending}>
								{pending ? "Saving..." : "Save item"}
							</PrimaryButton>
						</div>
					</form>
				)}
			</MenuPanel>

			<ConfirmAction
				open={Boolean(confirm)}
				title="Delete roadmap item"
				message={`Permanently delete "${confirm?.title}"?`}
				confirmLabel="Delete"
				pending={pending}
				error={error}
				onClose={() => setConfirm(null)}
				onConfirm={remove}
			/>
		</div>
	);
}
