"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { GhostButton, PrimaryButton } from "./Buttons";
import { Input } from "./Inputs";
import MenuPanel from "./MenuPanel";
import { deferEffect } from "@/lib/util/effects";

type ConfirmActionProps = Readonly<{
	open: boolean;
	title: ReactNode;
	message: ReactNode;
	confirmLabel: string;
	pending?: boolean;
	requireText?: string;
	requireLabel?: string;
	onClose: () => void;
	onConfirm: () => void;
}>;

export default function ConfirmAction({ open, title, message, confirmLabel, pending, requireText, requireLabel, onClose, onConfirm }: ConfirmActionProps) {
	const [step, setStep] = useState(1);
	const [text, setText] = useState("");
	const needsText = Boolean(requireText);
	const canConfirm = !needsText || text === requireText;

	useEffect(() => {
		if (!open) return;

		return deferEffect(() => {
			setStep(1);
			setText("");
		});
	}, [open]);

	return (
		<MenuPanel open={open} onClose={onClose} title={title} width="28rem" hasPortal>
			<div className="flex flex-col gap-4">
				<p className="text-sm text-text-muted">{message}</p>
				{needsText && step === 2 && (
					<label className="text-sm font-bold text-text-muted">
						{requireLabel ?? `Type ${requireText} to confirm`}
						<Input value={text} onChange={(event) => setText(event.target.value)} className="mt-1" autoFocus />
					</label>
				)}
				<div className="flex justify-end gap-2">
					<GhostButton type="button" onClick={onClose} disabled={pending} className="px-4 py-2">
						Cancel
					</GhostButton>
					{needsText && step === 1 ? (
						<PrimaryButton type="button" onClick={() => setStep(2)} disabled={pending} className="px-4 py-2">
							Continue
						</PrimaryButton>
					) : (
						<GhostButton
							type="button"
							onClick={onConfirm}
							disabled={pending || !canConfirm}
							className="border-error px-4 py-2 text-error hover:border-error hover:text-error disabled:cursor-wait disabled:opacity-60"
						>
							{pending ? "Working..." : confirmLabel}
						</GhostButton>
					)}
				</div>
			</div>
		</MenuPanel>
	);
}
