"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import StarRating from "@/components/game/StarRating";
import { SurfaceButton } from "@/components/ui/control/Button";
import { Checkbox } from "@/components/ui/control/Checkbox";
import { Select } from "@/components/ui/control/Select";
import { TextArea } from "@/components/ui/control/TextArea";
import { GameStatus } from "@/lib/generated/prisma/enums";
import { formLabel } from "@/lib/util/client/func";
import { useEntryEditor } from "./context";
import { timeModeLabel } from "./shared";

type EntryTabProps = Readonly<{
	isActive: boolean;
}>;

export default function EntryTab({ isActive }: EntryTabProps) {
	const { entry, save, entryStatus, setEntryStatus, isFinished, setEntryFinished, tags, setTags, isAddingTag, setAddingTag, tagInput, setTagInput, addTag, rating, setRating } =
		useEntryEditor();
	const [removingTag, setRemovingTag] = useState<string | null>(null);

	function removeTag(tag: string) {
		setRemovingTag(tag);
		setTimeout(() => {
			setTags((current) => current.filter((item) => item !== tag));
			setRemovingTag(null);
		}, 140);
	}

	return (
		<form id="entry-editor-entry-form" action={save} className={isActive ? "flex flex-col gap-3" : "hidden"}>
			<input type="hidden" name="timemode" value={timeModeLabel(entry.timeMode)} />
			<input type="hidden" name="timeplayed" value={entry.timePlayed ?? ""} />
			<input type="hidden" name="tagsTouched" value="1" />
			{tags
				.filter((tag) => tag !== removingTag)
				.map((tag) => (
					<input key={tag} type="hidden" name="tags" value={tag} />
				))}
			<Select
				label="Status"
				name="status"
				value={entryStatus}
				onChange={(event) => {
					const status = event.target.value as GameStatus;
					setEntryStatus(status);
					if (status === GameStatus.COMPLETED) setEntryFinished(true);
				}}
				className="w-full capitalize"
			>
				{Object.values(GameStatus).map((status) => (
					<option key={status} value={status}>
						{formLabel(status)}
					</option>
				))}
			</Select>
			<div className="grid gap-2 text-sm font-bold text-text-muted sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
				<StarRating rating={rating} size={28} isInteractive shouldShowValue name="rating" onChange={setRating} />
				<Checkbox
					label="Finished"
					name="finished"
					checked={isFinished}
					onChange={(event) => setEntryFinished(event.target.checked)}
					fieldClassName="rounded border border-border p-2"
				/>
				<Checkbox label="Mastered" name="mastered" defaultChecked={entry.timeMastered != null} fieldClassName="rounded border border-border p-2" />
			</div>
			<div className="text-sm font-bold text-text-muted">
				Tags
				<div className="mt-1 flex min-h-10 flex-wrap items-center gap-2">
					{tags.map((tag) => (
						<span
							key={tag}
							className={`flex h-8 max-w-full items-center gap-1 rounded border border-border bg-bg px-2 py-1 text-xs text-text ${removingTag === tag ? "animate-tag-chip-out" : "animate-tag-chip-in"}`}
						>
							<span className="truncate">{tag}</span>
							<button
								type="button"
								onClick={() => removeTag(tag)}
								className="grid size-4 shrink-0 cursor-pointer place-items-center rounded text-text-muted hover:text-error"
								aria-label={`Remove ${tag}`}
							>
								<X size={12} aria-hidden="true" />
							</button>
						</span>
					))}
					{isAddingTag ? (
						<input
							name="tags"
							// eslint-disable-next-line jsx-a11y/no-autofocus -- intentional: focus new tag input when it appears
							autoFocus
							value={tagInput}
							onChange={(event) => setTagInput(event.target.value)}
							onBlur={addTag}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.preventDefault();
									addTag();
								}
							}}
							className="animate-tag-input-in h-8 w-32 rounded border border-border bg-bg px-2 py-1 text-xs text-text outline-none"
							maxLength={40}
						/>
					) : (
						<SurfaceButton variant="outline" onClick={() => setAddingTag(true)} aria-label="Add tag" className="text-text">
							<Plus size={14} aria-hidden="true" />
						</SurfaceButton>
					)}
				</div>
			</div>
			<TextArea label="Notes" name="notes" rows={3} defaultValue={entry.notes ?? ""} />
		</form>
	);
}
