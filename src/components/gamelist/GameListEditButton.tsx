"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Trash2 } from "lucide-react";
import TierLabelsForm from "@/app/(library)/playlist/[id]/TierLabelsForm";
import { DangerButton, GhostButton } from "@/components/ui/control/Button";
import { Select } from "@/components/ui/control/Select";
import { TextArea } from "@/components/ui/control/TextArea";
import { TextInput } from "@/components/ui/control/TextInput";
import MenuPanel from "@/components/ui/MenuPanel";
import { deletePlaylist, updateGameListSettings } from "@/lib/actions/gamelist/lists";
import type { GameListModel } from "@/lib/generated/prisma/models/GameList";
import { ColorPicker } from "../ui/control/ColorPicker";

type GameListEditButtonProps = Readonly<{
	list: Pick<GameListModel, "id" | "type" | "name" | "description" | "image" | "background" | "color" | "accentColor" | "privacy" | "commentsHidden" | "displayMode">;
	tiers?: string[];
	tierColors?: string[];
}>;

export default function GameListEditButton({ list, tiers, tierColors }: GameListEditButtonProps) {
	const [open, setOpen] = useState(false);
	const [error, setError] = useState("");
	const [pending, startTransition] = useTransition();
	const router = useRouter();
	const action = updateGameListSettings.bind(null, list.id);
	const removeAction = deletePlaylist.bind(null, list.id);
	const isPlaylist = list.type === "PLAYLIST";

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
		if (!isPlaylist || !globalThis.confirm(`Delete "${list.name}"? This cannot be undone.`)) return;

		startTransition(async () => {
			await removeAction();
		});
	}

	return (
		<>
			<GhostButton variant="outline" type="button" onClick={() => setOpen(true)}>
				<Edit3 size={16} />
			</GhostButton>
			<MenuPanel
				open={open}
				onClose={() => setOpen(false)}
				title="Edit list"
				panelClassName="max-w-lg bg-bg"
				formId="game-list-edit-form"
				submitLabel={pending ? "Saving..." : "Save"}
				isSubmitPending={pending}
				footer={
					isPlaylist && (
						<DangerButton variant="outline" onClick={remove} disabled={pending}>
							<Trash2 size={16} />
							Delete
						</DangerButton>
					)
				}
			>
				<form id="game-list-edit-form" action={save} className="flex flex-col gap-3">
					<TextInput label="Name" name="name" required maxLength={80} defaultValue={list.name} fieldClassName="text-text" />
					<TextArea label="Bio" name="description" rows={1} maxLength={500} defaultValue={list.description ?? ""} fieldClassName="text-text" />
					<TextInput label="Background image" name="background" type="url" placeholder="https://..." defaultValue={list.background ?? ""} fieldClassName="text-text" />
					<div className="grid gap-3 md:grid-cols-2">
						<ColorPicker label="Color" name="color" defaultValue={list.color ?? "#7b5cdb"} />
						<ColorPicker label="Accent color" name="accentColor" defaultValue={list.accentColor ?? "#b8842f"} />
					</div>
					<Select label="Privacy" name="privacy" defaultValue={list.privacy} className="w-full">
						<option value="public">Public</option>
						<option value="private">Private</option>
					</Select>
					<Select label="Comments" name="commentsHidden" defaultValue={list.commentsHidden ? "true" : "false"} className="w-full">
						<option value="false">Enabled</option>
						<option value="true">Disabled</option>
					</Select>
					{isPlaylist && (
						<Select label="Display mode" name="displayMode" defaultValue={list.displayMode} className="w-full">
							<option value="GRID">Grid</option>
							<option value="RANKING">Ranking</option>
							<option value="TIER">Tier list</option>
						</Select>
					)}
					{isPlaylist && tiers && tierColors && <TierLabelsForm tiers={tiers} colors={tierColors} />}
					{error && <p className="text-sm font-bold text-error">{error}</p>}
				</form>
			</MenuPanel>
		</>
	);
}
