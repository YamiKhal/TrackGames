"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Buttons";
import { Input, Select } from "@/components/ui/Inputs";
import MenuPanel from "@/components/ui/MenuPanel";
import { GameStatus } from "@/lib/generated/prisma/enums";
import { deferHook, formLabel } from "@/lib/util/client/func";

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

export default function AdvancedLibraryFilterPanel({ open, onClose, filters, onChange, tags, onReset }: AdvancedLibraryFilterPanelProps) {
	const [filterSearch, setFilterSearch] = useState("");
	const [pickerOpen, setPickerOpen] = useState(false);
	const pickerRef = useRef<HTMLDivElement>(null);
	const search = filterSearch.trim().toLowerCase();
	const statusOptions = useMemo(() => Object.values(GameStatus).filter((status) => formLabel(status).includes(search) || status.toLowerCase().includes(search)), [search]);
	const tagOptions = useMemo(() => tags.filter((tag) => tag.toLowerCase().includes(search)), [search, tags]);

	useEffect(() => {
		if (open) return;
		return deferHook(() => setPickerOpen(false));
	}, [open]);

	useEffect(() => {
		if (!pickerOpen) return;

		function closePickerOnOutsideClick(event: PointerEvent) {
			if (!pickerRef.current?.contains(event.target as Node)) setPickerOpen(false);
		}

		document.addEventListener("pointerdown", closePickerOnOutsideClick);
		return () => document.removeEventListener("pointerdown", closePickerOnOutsideClick);
	}, [pickerOpen]);

	function addStatus(status: GameStatus, mode: "include" | "exclude") {
		onChange({
			...filters,
			statuses: mode === "include" ? Array.from(new Set([...filters.statuses, status])) : filters.statuses.filter((item) => item !== status),
			excludedStatuses: mode === "exclude" ? Array.from(new Set([...filters.excludedStatuses, status])) : filters.excludedStatuses.filter((item) => item !== status),
		});
		setPickerOpen(false);
	}

	function addTag(tag: string, mode: "include" | "exclude") {
		onChange({
			...filters,
			tags: mode === "include" ? Array.from(new Set([...filters.tags, tag])) : removeValue(filters.tags, tag),
			excludedTags: mode === "exclude" ? Array.from(new Set([...filters.excludedTags, tag])) : removeValue(filters.excludedTags, tag),
		});
		setPickerOpen(false);
	}

	return (
		<MenuPanel open={open} onClose={onClose} variant="drawer-left" width="28rem" title="Filter" closeLabel="Close filters">
			<div className="flex flex-col gap-5 text-sm">
					<section>
						<h4 className="mb-2 font-bold text-text">Statuses and tags</h4>
						<div ref={pickerRef} className="relative">
							<Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-faint" aria-hidden="true" />
							<Input
								value={filterSearch}
								onChange={(event) => {
									setFilterSearch(event.target.value);
									setPickerOpen(true);
								}}
								onFocus={() => setPickerOpen(true)}
								placeholder="Search statuses or tags"
								className="pl-9"
								aria-expanded={pickerOpen}
								aria-controls="advanced-filter-picker"
							/>
							{pickerOpen && (
								<div
									id="advanced-filter-picker"
									className="absolute top-full right-0 left-0 z-10 mt-2 max-h-72 overflow-y-auto rounded border border-border bg-bg-secondary p-2 shadow-main"
								>
									{statusOptions.length > 0 && (
										<div className="mb-2">
											<p className="px-2 pb-1 text-xs font-bold text-text-faint uppercase">Statuses</p>
											<div className="grid gap-1">
												{statusOptions.map((status) => (
													<div key={status} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded px-2 py-1.5 hover:bg-bg">
														<span className="truncate text-text-muted capitalize">{formLabel(status)}</span>
														<button
															type="button"
															onClick={() => addStatus(status, "include")}
															className="rounded border border-border px-2 py-1 text-xs font-bold text-text-muted hover:border-primary hover:text-primary"
														>
															Include
														</button>
														<button
															type="button"
															onClick={() => addStatus(status, "exclude")}
															className="rounded border border-border px-2 py-1 text-xs font-bold text-text-muted hover:border-error hover:text-error"
														>
															Exclude
														</button>
													</div>
												))}
											</div>
										</div>
									)}
									{tagOptions.length > 0 && (
										<div>
											<p className="px-2 pb-1 text-xs font-bold text-text-faint uppercase">Tags</p>
											<div className="grid gap-1">
												{tagOptions.map((tag) => (
													<div key={tag} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded px-2 py-1.5 hover:bg-bg">
														<span className="truncate text-text-muted">{tag}</span>
														<button
															type="button"
															onClick={() => addTag(tag, "include")}
															className="rounded border border-border px-2 py-1 text-xs font-bold text-text-muted hover:border-primary hover:text-primary"
														>
															Include
														</button>
														<button
															type="button"
															onClick={() => addTag(tag, "exclude")}
															className="rounded border border-border px-2 py-1 text-xs font-bold text-text-muted hover:border-error hover:text-error"
														>
															Exclude
														</button>
													</div>
												))}
											</div>
										</div>
									)}
									{!statusOptions.length && !tagOptions.length && (
										<p className="p-2 text-sm text-text-muted">{tags.length ? "No matching statuses or tags." : "No tags yet."}</p>
									)}
								</div>
							)}
						</div>
					</section>

					<section className="grid gap-3">
						<div>
							<h4 className="mb-2 font-bold text-text">Include</h4>
							{filters.statuses.length || filters.tags.length ? (
								<div className="flex flex-wrap gap-2">
									{filters.statuses.map((status) => (
										<button
											key={status}
											type="button"
											onClick={() => onChange({ ...filters, statuses: filters.statuses.filter((item) => item !== status) })}
											className="flex max-w-full items-center gap-1 rounded border border-primary/60 bg-primary/10 px-2 py-1 text-xs font-bold text-primary capitalize"
										>
											<span className="truncate">{formLabel(status)}</span>
											<X size={13} aria-hidden="true" />
										</button>
									))}
									{filters.tags.map((tag) => (
										<button
											key={tag}
											type="button"
											onClick={() => onChange({ ...filters, tags: removeValue(filters.tags, tag) })}
											className="flex max-w-full items-center gap-1 rounded border border-primary/60 bg-primary/10 px-2 py-1 text-xs font-bold text-primary"
										>
											<span className="truncate">{tag}</span>
											<X size={13} aria-hidden="true" />
										</button>
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
										<button
											key={status}
											type="button"
											onClick={() =>
												onChange({
													...filters,
													excludedStatuses: filters.excludedStatuses.filter((item) => item !== status),
												})
											}
											className="flex max-w-full items-center gap-1 rounded border border-error/60 bg-error/10 px-2 py-1 text-xs font-bold text-error capitalize"
										>
											<span className="truncate">{formLabel(status)}</span>
											<X size={13} aria-hidden="true" />
										</button>
									))}
									{filters.excludedTags.map((tag) => (
										<button
											key={tag}
											type="button"
											onClick={() => onChange({ ...filters, excludedTags: removeValue(filters.excludedTags, tag) })}
											className="flex max-w-full items-center gap-1 rounded border border-error/60 bg-error/10 px-2 py-1 text-xs font-bold text-error"
										>
											<span className="truncate">{tag}</span>
											<X size={13} aria-hidden="true" />
										</button>
									))}
								</div>
							) : (
								<p className="text-text-muted">Nothing excluded.</p>
							)}
						</div>
					</section>

					<section className="grid gap-3 sm:grid-cols-2">
						<h4 className="font-bold text-text sm:col-span-2">Rating</h4>
						<Input
							type="number"
							min={0}
							max={5}
							step={0.5}
							value={filters.ratingMin}
							onChange={(event) => onChange({ ...filters, ratingMin: event.target.value })}
							placeholder="Min"
						/>
						<Input
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
						<Input
							type="number"
							min={0}
							step={0.1}
							value={filters.hoursMin}
							onChange={(event) => onChange({ ...filters, hoursMin: event.target.value })}
							placeholder="Min"
						/>
						<Input
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

			<div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
				<GhostButton type="button" onClick={onReset}>
					Reset
				</GhostButton>
				<PrimaryButton type="button" onClick={onClose}>
					Apply
				</PrimaryButton>
			</div>
		</MenuPanel>
	);
}

function removeValue(values: string[], value: string) {
	return values.filter((item) => item !== value);
}
