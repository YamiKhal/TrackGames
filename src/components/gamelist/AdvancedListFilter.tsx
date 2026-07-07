"use client";

import { GhostButton, PrimaryButton } from "@/components/ui/control/Button";
import { Select } from "@/components/ui/control/Select";
import { TextInput } from "@/components/ui/control/TextInput";
import MenuPanel from "@/components/ui/MenuPanel";
import RemovableChip from "@/components/ui/RemovableChip";
import type { GameStatus } from "@/lib/generated/prisma/enums";
import { formLabel } from "@/lib/util/client/func";
import TagStatusPicker from "./TagStatusPicker";

type AdvancedLibraryFilterPanelProps = Readonly<{
	open: boolean;
	onClose: () => void;
	filters: AdvancedLibraryFilters;
	onChange: (filters: AdvancedLibraryFilters) => void;
	tags: string[];
	onReset: () => void;
}>;

export type AdvancedLibraryFilters = {
	statuses: GameStatus[];
	excludedStatuses: GameStatus[];
	ratingMin: string;
	ratingMax: string;
	hoursMin: string;
	hoursMax: string;
	finished: "any" | "yes" | "no";
	mastered: "any" | "yes" | "no";
	tags: string[];
	excludedTags: string[];
};

export const emptyAdvancedLibraryFilters: AdvancedLibraryFilters = {
	statuses: [],
	excludedStatuses: [],
	ratingMin: "",
	ratingMax: "",
	hoursMin: "",
	hoursMax: "",
	finished: "any",
	mastered: "any",
	tags: [],
	excludedTags: [],
};

export default function AdvancedListFilter({ open, onClose, filters, onChange, tags, onReset }: AdvancedLibraryFilterPanelProps) {
	function addStatus(status: GameStatus, mode: "include" | "exclude") {
		onChange({
			...filters,
			statuses: mode === "include" ? Array.from(new Set([...filters.statuses, status])) : filters.statuses.filter((item) => item !== status),
			excludedStatuses: mode === "exclude" ? Array.from(new Set([...filters.excludedStatuses, status])) : filters.excludedStatuses.filter((item) => item !== status),
		});
	}

	function addTag(tag: string, mode: "include" | "exclude") {
		onChange({
			...filters,
			tags: mode === "include" ? Array.from(new Set([...filters.tags, tag])) : removeValue(filters.tags, tag),
			excludedTags: mode === "exclude" ? Array.from(new Set([...filters.excludedTags, tag])) : removeValue(filters.excludedTags, tag),
		});
	}

	return (
		<MenuPanel
			open={open}
			onClose={onClose}
			variant="drawer-left"
			width="28rem"
			title="Filter"
			footer={
				<div className="flex flex-row gap-2">
					<GhostButton variant="outline" type="button" onClick={onReset}>
						Reset
					</GhostButton>
					<PrimaryButton type="button" onClick={onClose}>
						Apply
					</PrimaryButton>
				</div>
			}
		>
			<div className="flex flex-col gap-5 text-sm">
				<section>
					<h4 className="mb-2 font-bold text-text">Statuses and tags</h4>
					<TagStatusPicker open={open} tags={tags} onAddStatus={addStatus} onAddTag={addTag} />
				</section>

				<section className="grid gap-3">
					<div>
						<h4 className="mb-2 font-bold text-text">Include</h4>
						{filters.statuses.length || filters.tags.length ? (
							<div className="flex flex-wrap gap-2">
								{filters.statuses.map((status) => (
									<RemovableChip
										key={status}
										variant="include"
										isCapitalized
										onRemove={() => onChange({ ...filters, statuses: filters.statuses.filter((item) => item !== status) })}
									>
										{formLabel(status)}
									</RemovableChip>
								))}
								{filters.tags.map((tag) => (
									<RemovableChip key={tag} variant="include" onRemove={() => onChange({ ...filters, tags: removeValue(filters.tags, tag) })}>
										{tag}
									</RemovableChip>
								))}
							</div>
						) : (
							<p className="text-text-muted">Any status or tag.</p>
						)}
					</div>
					<div>
						<h4 className="mb-2 font-bold text-text">Exclude</h4>
						{filters.excludedStatuses.length || filters.excludedTags.length ? (
							<div className="flex flex-wrap gap-2">
								{filters.excludedStatuses.map((status) => (
									<RemovableChip
										key={status}
										variant="exclude"
										isCapitalized
										onRemove={() =>
											onChange({
												...filters,
												excludedStatuses: filters.excludedStatuses.filter((item) => item !== status),
											})
										}
									>
										{formLabel(status)}
									</RemovableChip>
								))}
								{filters.excludedTags.map((tag) => (
									<RemovableChip key={tag} variant="exclude" onRemove={() => onChange({ ...filters, excludedTags: removeValue(filters.excludedTags, tag) })}>
										{tag}
									</RemovableChip>
								))}
							</div>
						) : (
							<p className="text-text-muted">Nothing excluded.</p>
						)}
					</div>
				</section>

				<section className="grid gap-3 sm:grid-cols-2">
					<h4 className="font-bold text-text sm:col-span-2">Rating</h4>
					<TextInput
						type="number"
						min={0}
						max={5}
						step={0.5}
						value={filters.ratingMin}
						onChange={(event) => onChange({ ...filters, ratingMin: event.target.value })}
						placeholder="Min"
					/>
					<TextInput
						type="number"
						min={0}
						max={5}
						step={0.5}
						value={filters.ratingMax}
						onChange={(event) => onChange({ ...filters, ratingMax: event.target.value })}
						placeholder="Max"
					/>
				</section>

				<section className="grid gap-3 sm:grid-cols-2">
					<h4 className="font-bold text-text sm:col-span-2">Game hours</h4>
					<TextInput
						type="number"
						min={0}
						step={0.1}
						value={filters.hoursMin}
						onChange={(event) => onChange({ ...filters, hoursMin: event.target.value })}
						placeholder="Min"
					/>
					<TextInput
						type="number"
						min={0}
						step={0.1}
						value={filters.hoursMax}
						onChange={(event) => onChange({ ...filters, hoursMax: event.target.value })}
						placeholder="Max"
					/>
				</section>

				<section className="grid gap-3 sm:grid-cols-2">
					<label className="font-bold text-text-muted">
						Finished
						<Select
							value={filters.finished}
							onChange={(event) => onChange({ ...filters, finished: event.target.value as AdvancedLibraryFilters["finished"] })}
							className="w-full"
						>
							<option value="any">Any</option>
							<option value="yes">Finished</option>
							<option value="no">Not finished</option>
						</Select>
					</label>
					<label className="font-bold text-text-muted">
						Mastered
						<Select
							value={filters.mastered}
							onChange={(event) => onChange({ ...filters, mastered: event.target.value as AdvancedLibraryFilters["mastered"] })}
							className="w-full"
						>
							<option value="any">Any</option>
							<option value="yes">Mastered</option>
							<option value="no">Not mastered</option>
						</Select>
					</label>
				</section>
			</div>
		</MenuPanel>
	);
}

function removeValue(values: string[], value: string) {
	return values.filter((item) => item !== value);
}
