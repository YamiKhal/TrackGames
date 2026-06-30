"use client";

import { GhostButton, PrimaryButton } from "@/app/components/ui/Buttons";
import { Input } from "@/app/components/ui/Inputs";
import MenuPanel from "@/app/components/ui/MenuPanel";
import * as normalize from "@/lib/util/normalize";
import { useEffect, useState } from "react";

type ColorFieldProps = Readonly<{ name: string; value: string; onChange: (value: string) => void; placeholder: string; label: string }>;

type MediaModelProps = Readonly<{ open: boolean; title: string; value: string; onClose: () => void; onSave: (value: string) => void }>;

export function ColorField({ name, value, onChange, placeholder, label }: ColorFieldProps) {
	const pickerValue = normalize.hexColor(value || placeholder);

	return (
		<div className="flex flex-col">
			<div className="flex flex-row items-center gap-2">
				<label
					className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded border border-border bg-bg transition-colors hover:border-primary"
					title={`Pick ${label.toLowerCase()}`}
					aria-label={`Pick ${label.toLowerCase()}`}
				>
					<span className="block h-full w-full" style={{ background: value || "transparent" }} />
					<input
						type="color"
						value={pickerValue}
						onChange={(event) => onChange(event.target.value.toUpperCase())}
						className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
					/>
				</label>
				<Input name={name} value={value} onChange={(event) => onChange(event.target.value)} type="text" placeholder={placeholder} className="w-auto" />
			</div>
			<p className="ml-10 text-[0.7rem] text-text-muted">{label}</p>
		</div>
	);
}

export function MediaModal({ open, title, value, onClose, onSave }: MediaModelProps) {
	const [draft, setDraft] = useState(value);

	useEffect(() => {
		if (!open) return;

		const frame = globalThis.requestAnimationFrame(() => setDraft(value));
		return () => globalThis.cancelAnimationFrame(frame);
	}, [open, value]);

	return (
		<MenuPanel open={open} onClose={onClose} title={title}>
			<div className="flex flex-col gap-3">
				<Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="https://..." />
			</div>
			<div className="mt-5 flex justify-end gap-2">
				<GhostButton type="button" onClick={onClose}>
					Cancel
				</GhostButton>
				<PrimaryButton type="button" onClick={() => onSave(draft)}>
					Apply
				</PrimaryButton>
			</div>
		</MenuPanel>
	);
}

export function SaveBar() {
	return (
		<div className="bottom-4 z-20 mt-5 flex justify-end">
			<div className="flex gap-2 rounded p-2">
				<PrimaryButton type="submit">Save</PrimaryButton>
			</div>
		</div>
	);
}
