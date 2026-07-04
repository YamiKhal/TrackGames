"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Trash2 } from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Buttons";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Inputs";
import MenuPanel from "@/components/ui/MenuPanel";
import { deletePlaylist, updateGameListSettings } from "@/lib/actions/playlists";
import type { GameListModel } from "@/lib/generated/prisma/models/GameList";

export default function GameListEditButton({
	list,
}: Readonly<{
	list: Pick<GameListModel, "id" | "type" | "name" | "description" | "image" | "background" | "color" | "accentColor" | "privacy" | "commentsHidden">;
}>) {
	const [open, setOpen] = useState(false);
	const [error, setError] = useState("");
	const [pending, startTransition] = useTransition();
	const router = useRouter();
	const action = updateGameListSettings.bind(null, list.id);
	const removeAction = deletePlaylist.bind(null, list.id);
	const canDelete = list.type === "PLAYLIST";

	function save(formData: FormData) {
		setError("");
		startTransition(async () => {
			const response = await action(formData);

			if (response?.error) {
				setError(response.error);
				return;
			}

			router.refresh();
			setOpen(false);
		});
	}

	function remove() {
		if (!canDelete || !globalThis.confirm(`Delete "${list.name}"? This cannot be undone.`)) return;

		startTransition(async () => {
			await removeAction();
		});
	}

	return (
		<>
			<GhostButton type="button" onClick={() => setOpen(true)}>
				<Edit3 size={16} />
			</GhostButton>
			<MenuPanel open={open} onClose={() => setOpen(false)} title="Edit list" panelClassName="max-w-lg bg-bg">
				<form action={save} className="flex flex-col gap-3">
					<label className="text-sm font-bold text-text-muted">
						Name
						<Input name="name" required maxLength={80} defaultValue={list.name} />
					</label>
					<label className="text-sm font-bold text-text-muted">
						Bio
						<Textarea name="description" rows={1} maxLength={500} defaultValue={list.description ?? ""} />
					</label>
					<label className="text-sm font-bold text-text-muted">
						Background image
						<Input name="background" type="url" placeholder="https://..." defaultValue={list.background ?? ""} />
					</label>
					<div className="grid gap-3 md:grid-cols-2">
						<label className="flex flex-row items-center gap-2 text-sm font-bold text-text-muted">
							<Input name="color" type="color" defaultValue={list.color ?? "#7b5cdb"} className="max-h-10 max-w-10" />
							Theme
						</label>
						<label className="flex flex-row items-center gap-2 text-sm font-bold text-text-muted">
							<Input name="accentColor" type="color" defaultValue={list.accentColor ?? "#b8842f"} className="max-h-10 max-w-10" />
							Accent
						</label>
					</div>
					<label className="text-sm font-bold text-text-muted">
						Privacy
						<Select name="privacy" defaultValue={list.privacy} className="w-full">
							<option value="public">Public</option>
							<option value="private">Private</option>
						</Select>
					</label>
					<label className="flex items-center gap-2 text-sm font-bold text-text-muted">
						<Checkbox name="commentsHidden" defaultChecked={list.commentsHidden} />
						Hide comments
					</label>
					{error && <p className="text-sm font-bold text-error">{error}</p>}
					<div className="mt-2 flex flex-wrap justify-between gap-2">
						{canDelete && (
							<button
								type="button"
								onClick={remove}
								disabled={pending}
								className="flex cursor-pointer items-center gap-2 rounded border border-error/50 px-4 py-2 text-sm font-bold text-error hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-60"
							>
								<Trash2 size={16} />
								Delete
							</button>
						)}
						<div className="ml-auto flex gap-2">
							<GhostButton type="button" onClick={() => setOpen(false)}>
								Cancel
							</GhostButton>
							<PrimaryButton type="submit" disabled={pending}>
								{pending ? "Saving..." : "Save"}
							</PrimaryButton>
						</div>
					</div>
				</form>
			</MenuPanel>
		</>
	);
}
