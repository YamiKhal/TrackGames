"use client";

import { useState } from "react";
import { Pin, Plus } from "lucide-react";
import { useAdminAction } from "@/app/(admin)/dashboard/_tabs/useAdminAction";
import MarkdownWidgetEditor from "@/app/(user)/settings/MarkdownWidgetEditor";
import ConfirmAction from "@/components/ui/ConfirmAction";
import { DangerButton, GhostButton, PrimaryButton } from "@/components/ui/control/Button";
import { Checkbox } from "@/components/ui/control/Checkbox";
import { TextArea } from "@/components/ui/control/TextArea";
import { TextInput } from "@/components/ui/control/TextInput";
import MenuPanel from "@/components/ui/MenuPanel";
import { createChangelog, deleteChangelog, updateChangelog } from "@/lib/actions/admin/adminDocs";
import { joinClass } from "@/lib/util/client/func";

type AdminChangelog = {
	id: string;
	slug: string;
	title: string;
	version: string | null;
	summary: string | null;
	pinned: boolean;
	published: boolean;
	publishedAt: string;
	content: string;
};

export default function ChangelogAdminPanel({ entries }: Readonly<{ entries: AdminChangelog[] }>) {
	const [editing, setEditing] = useState<AdminChangelog | "new" | null>(null);
	const [content, setContent] = useState("");
	const [confirm, setConfirm] = useState<AdminChangelog | null>(null);
	const { run, pending, error } = useAdminAction();

	const current = editing === "new" ? null : editing;

	function open(entry: AdminChangelog | "new") {
		setEditing(entry);
		setContent(entry === "new" ? "" : entry.content);
	}

	function submit(formData: FormData) {
		formData.set("content", content);
		if (current) formData.set("id", current.id);
		run(current ? updateChangelog : createChangelog, formData, () => setEditing(null));
	}

	function remove() {
		if (!confirm) return;
		const data = new FormData();
		data.set("id", confirm.id);
		run(deleteChangelog, data, () => setConfirm(null));
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-end">
				<PrimaryButton type="button" onClick={() => open("new")}>
					<Plus size={16} /> New entry
				</PrimaryButton>
			</div>

			{entries.length === 0 ? (
				<p className="text-sm text-text-muted">No changelog entries yet.</p>
			) : (
				<ul className="flex flex-col gap-2">
					{entries.map((entry) => (
						<li
							key={entry.id}
							className="flex cursor-pointer flex-col gap-3 rounded border border-border p-4 transition-colors hover:border-primary/40 sm:flex-row sm:items-center"
						>
							<span className={joinClass("size-2 shrink-0 rounded-full", entry.published ? "bg-success" : "bg-text-faint")} aria-hidden="true" />
							<div className="flex min-w-0 flex-1 flex-col gap-1">
								<span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-text">
									{entry.pinned && <Pin size={13} className="text-primary" aria-hidden="true" />}
									{entry.title}
									{entry.version && <span className="text-xs font-normal text-text-faint">v{entry.version}</span>}
									{!entry.published && <span className="rounded border border-border px-1.5 py-0.5 text-[0.6rem] font-bold text-text-muted">DRAFT</span>}
								</span>
								<span className="text-xs text-text-faint">{new Date(entry.publishedAt).toLocaleDateString()}</span>
							</div>
							<div className="flex shrink-0 gap-1">
								<GhostButton variant="text" type="button" onClick={() => open(entry)} className="px-3 py-2">
									Edit
								</GhostButton>
								<DangerButton variant="text" type="button" onClick={() => setConfirm(entry)} className="px-3 py-2">
									Delete
								</DangerButton>
							</div>
						</li>
					))}
				</ul>
			)}

			<MenuPanel open={Boolean(editing)} onClose={() => setEditing(null)} title={current ? "Edit entry" : "New changelog entry"} width="42rem" shouldShowClose={false}>
				{editing && (
					<form action={submit} className="flex flex-col gap-4">
						<TextInput name="title" label="Title" defaultValue={current?.title ?? ""} required maxLength={200} />
						<div className="grid gap-3 sm:grid-cols-2">
							<TextInput name="slug" label="Slug (optional)" defaultValue={current?.slug ?? ""} placeholder="auto from title" maxLength={200} />
							<TextInput name="version" label="Version (optional)" defaultValue={current?.version ?? ""} maxLength={50} />
						</div>
						<TextArea name="summary" label="Summary (optional)" rows={2} maxLength={2000} defaultValue={current?.summary ?? ""} />
						<div className="grid items-end gap-3 sm:grid-cols-2">
							<TextInput name="publishedAt" type="date" label="Publish date" defaultValue={(current?.publishedAt ?? new Date().toISOString()).slice(0, 10)} />
							<div className="flex gap-5 pb-2">
								<Checkbox name="pinned" label="Pinned" defaultChecked={current?.pinned ?? false} />
								<Checkbox name="published" label="Published" defaultChecked={current?.published ?? true} />
							</div>
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
								{pending ? "Saving..." : "Save entry"}
							</PrimaryButton>
						</div>
					</form>
				)}
			</MenuPanel>

			<ConfirmAction
				open={Boolean(confirm)}
				title="Delete changelog entry"
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
