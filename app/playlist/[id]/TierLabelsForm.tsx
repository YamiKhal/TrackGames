"use client";

import { updatePlaylistTiers } from "@/lib/actions/playlists";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { GhostButton } from "../../components/ui/Buttons";
import { Input } from "../../components/ui/Inputs";

type TierLabelsFormProps = Readonly<{
	playlistId: string;
	tiers: string[];
	colors: string[];
}>;

function filterItems(current: any[], index: number) {
	return current.filter((_, itemIndex) => itemIndex !== index);
}

export default function TierLabelsForm({ playlistId, tiers, colors }: TierLabelsFormProps) {
	const [open, setOpen] = useState(false);
	const [items, setItems] = useState(
		(tiers.length ? tiers : ["S", "A", "B", "C", "D"]).map((label, index) => ({
			label,
			color: colors[index] ?? "#64748b",
		})),
	);
	const action = updatePlaylistTiers.bind(null, playlistId);

	return (
		<form action={action} className="rounded bg-bg p-4">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="flex w-full cursor-pointer items-center justify-between gap-2 text-sm font-bold"
			>
				Tier labels
				{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
			</button>
			{open && (
				<div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
					{items.map((tier, index) => (
						<div key={tier.label} className="flex gap-2">
							<Input
								name="colors"
								type="color"
								value={tier.color}
								onChange={(event) => {
									const next = [...items];
									next[index] = { ...next[index], color: event.target.value };
									setItems(next);
								}}
								className="h-9 max-w-12 shrink-0 p-1"
								aria-label={`${tier.label} color`}
							/>
							<Input
								name="tiers"
								value={tier.label}
								maxLength={24}
								onChange={(event) => {
									const next = [...items];
									next[index] = { ...next[index], label: event.target.value };
									setItems(next);
								}}
							/>
							<button
								type="button"
								onClick={() => setItems((current) => filterItems(current, index))}
								disabled={items.length === 1}
								className="grid size-9 shrink-0 cursor-pointer place-items-center rounded text-text-muted hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
								aria-label="Remove tier"
							>
								<Trash2 size={16} />
							</button>
						</div>
					))}
					<button
						type="button"
						onClick={() => setItems((current) => [...current, { label: "New tier", color: "#64748b" }])}
						className="flex w-fit cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm font-bold text-text-muted hover:text-primary"
					>
						<Plus size={16} />
						Add tier
					</button>
					<GhostButton type="submit" className="mt-1 w-fit px-4">
						Save tiers
					</GhostButton>
				</div>
			)}
		</form>
	);
}
