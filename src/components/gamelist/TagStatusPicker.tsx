"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { TextInput } from "@/components/ui/control/TextInput";
import { GameStatus } from "@/lib/generated/prisma/enums";
import { deferHook, formLabel } from "@/lib/util/client/func";

type TagStatusPickerProps = Readonly<{
	open: boolean;
	tags: string[];
	onAddStatus: (status: GameStatus, mode: "include" | "exclude") => void;
	onAddTag: (tag: string, mode: "include" | "exclude") => void;
}>;

function IncludeExcludeButtons({ onInclude, onExclude }: Readonly<{ onInclude: () => void; onExclude: () => void }>) {
	return (
		<>
			<button type="button" onClick={onInclude} className="rounded border border-border px-2 py-1 text-xs font-bold text-text-muted hover:border-primary hover:text-primary">
				Include
			</button>
			<button type="button" onClick={onExclude} className="rounded border border-border px-2 py-1 text-xs font-bold text-text-muted hover:border-error hover:text-error">
				Exclude
			</button>
		</>
	);
}

export default function TagStatusPicker({ open, tags, onAddStatus, onAddTag }: TagStatusPickerProps) {
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
		onAddStatus(status, mode);
		setPickerOpen(false);
	}

	function addTag(tag: string, mode: "include" | "exclude") {
		onAddTag(tag, mode);
		setPickerOpen(false);
	}

	return (
		<div ref={pickerRef} className="relative">
			<Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-faint" aria-hidden="true" />
			<TextInput
				value={filterSearch}
				onChange={(event) => {
					setFilterSearch(event.target.value);
					setPickerOpen(true);
				}}
				onFocus={() => setPickerOpen(true)}
				placeholder="Search statuses or tags"
				className="pl-9 text-text"
				aria-expanded={pickerOpen}
				aria-controls="advanced-filter-picker"
			/>
			{pickerOpen && (
				<div
					id="advanced-filter-picker"
					className="shadow-main absolute top-full right-0 left-0 z-elevated mt-2 max-h-72 overflow-y-auto rounded border border-border bg-bg-secondary p-2"
				>
					{statusOptions.length > 0 && (
						<div className="mb-2">
							<p className="px-2 pb-1 text-xs font-bold text-text-faint uppercase">Statuses</p>
							<div className="grid gap-1">
								{statusOptions.map((status) => (
									<div key={status} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded px-2 py-1.5 hover:bg-bg">
										<span className="truncate text-text-muted capitalize">{formLabel(status)}</span>
										<IncludeExcludeButtons onInclude={() => addStatus(status, "include")} onExclude={() => addStatus(status, "exclude")} />
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
										<IncludeExcludeButtons onInclude={() => addTag(tag, "include")} onExclude={() => addTag(tag, "exclude")} />
									</div>
								))}
							</div>
						</div>
					)}
					{!statusOptions.length && !tagOptions.length && <p className="p-2 text-sm text-text-muted">{tags.length ? "No matching statuses or tags." : "No tags yet."}</p>}
				</div>
			)}
		</div>
	);
}
