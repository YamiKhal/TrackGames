"use client";

import { useState } from "react";
import ConfirmAction from "@/components/ui/ConfirmAction";
import { GhostButton, PrimaryButton } from "@/components/ui/control/Button";
import { Select } from "@/components/ui/control/Select";
import { TextInput } from "@/components/ui/control/TextInput";

type PlaylistTabProps = Readonly<{
	position: number | null;
	tier: string | null;
	tiers: string[];
	save: (formData: FormData) => void;
	onRemove: () => void;
	onClose: () => void;
	pending: boolean;
}>;

export default function PlaylistTab({ position, tier, tiers, save, onRemove, onClose, pending }: PlaylistTabProps) {
	const [openPlaylistConfirm, setOpenPlaylistConfirm] = useState(false);

	return (
		<form action={save} className="flex min-h-full flex-col gap-3">
			<TextInput label="Position" name="position" type="number" min={1} step={1} defaultValue={position ?? ""} />
			<Select label="Tier" name="tier" defaultValue={tier ?? tiers[0] ?? "A"} className="w-full">
				{tiers.map((item) => (
					<option key={item} value={item}>
						{item}
					</option>
				))}
			</Select>
			<ConfirmAction
				open={openPlaylistConfirm}
				title="Removal from Playlist?"
				message="Confirm if you want to remove this item from your playlist"
				confirmLabel="Confirm"
				onClose={() => setOpenPlaylistConfirm(false)}
				onConfirm={onRemove}
			/>
			<div className="mt-auto flex items-center justify-between gap-2 pt-2">
				<GhostButton
					variant="outline"
					type="button"
					onClick={() => setOpenPlaylistConfirm(true)}
					disabled={pending}
					className="text-error hover:border-error hover:text-error"
				>
					Remove
				</GhostButton>
				<div className="flex items-center gap-2">
					<GhostButton variant="outline" type="button" onClick={onClose}>
						Cancel
					</GhostButton>
					<PrimaryButton type="submit" disabled={pending}>
						{pending ? "Saving..." : "Save"}
					</PrimaryButton>
				</div>
			</div>
		</form>
	);
}
