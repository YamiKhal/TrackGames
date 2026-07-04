"use client";

import type { RefObject, SyntheticEvent } from "react";
import { useEffect, useRef, useState } from "react";

let scrollLockCount = 0;

function lockScroll() {
	scrollLockCount += 1;
	if (scrollLockCount === 1) document.documentElement.style.overflow = "hidden";
}

function unlockScroll() {
	scrollLockCount = Math.max(0, scrollLockCount - 1);
	if (scrollLockCount === 0) document.documentElement.style.overflow = "";
}

export function useOverlay(open: boolean, onClose: () => void, anchorRef?: RefObject<HTMLElement | null>) {
	const [rendered, setRendered] = useState(open);
	const panelRef = useRef<HTMLDivElement>(null);
	const dialogRef = useRef<HTMLDialogElement | null>(null);
	const previousFocusRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		if (!open) return;

		previousFocusRef.current = document.activeElement as HTMLElement | null;

		const frame = globalThis.requestAnimationFrame(() => setRendered(true));
		return () => globalThis.cancelAnimationFrame(frame);
	}, [open]);

	useEffect(() => {
		if (!rendered) return;

		lockScroll();
		return unlockScroll;
	}, [rendered]);

	useEffect(() => {
		if (!open) return;
		if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
	}, [open]);

	useEffect(() => {
		if (dialogRef.current || !rendered || !open) return;

		const panel = panelRef.current;
		const focusable = panel?.querySelector<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
		(focusable ?? panel)?.focus();
	}, [rendered, open]);

	useEffect(() => {
		if (!rendered) return;

		function closeOnEscape(event: KeyboardEvent) {
			if (event.key === "Escape") onClose();
		}

		function closeOnOutsideClick(event: PointerEvent) {
			if (!anchorRef) return;
			if (!panelRef.current?.contains(event.target as Node) && !anchorRef.current?.contains(event.target as Node)) onClose();
		}

		document.addEventListener("keydown", closeOnEscape);
		document.addEventListener("pointerdown", closeOnOutsideClick);

		return () => {
			document.removeEventListener("keydown", closeOnEscape);
			document.removeEventListener("pointerdown", closeOnOutsideClick);
		};
	}, [anchorRef, onClose, rendered]);

	function attachDialog(node: HTMLDialogElement | null) {
		dialogRef.current = node;
		if (node && open && !node.open) node.showModal();
	}

	function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
		event.preventDefault();
		onClose();
	}

	function handleAnimationEnd() {
		if (open) return;

		setRendered(false);
		if (dialogRef.current?.open) dialogRef.current.close();
		previousFocusRef.current?.focus();
	}

	return { rendered, panelRef, attachDialog, handleCancel, handleAnimationEnd };
}
