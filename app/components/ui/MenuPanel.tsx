"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, RefObject, ReactNode } from "react";
import HighLevelIsland from "./HighLevelIsland";

type MenuPanelProps = Readonly<{
	open: boolean;
	onClose: () => void;
	title?: ReactNode;
	children: ReactNode;
	footer?: ReactNode;
	variant?: "modal" | "anchored";
	panelClassName?: string;
	className?: string;
	closeLabel?: string;
	hasPortal?: boolean;
	shouldShowClose?: boolean;
	role?: string;
	id?: string;
	anchorRef?: RefObject<HTMLElement | null>;
	width?: string;
	style?: CSSProperties;
}>;

function join(base: string, extra?: string) {
	return [base, extra].filter(Boolean).join(" ");
}

export default function MenuPanel({
	open,
	onClose,
	title,
	children,
	footer,
	variant = "modal",
	panelClassName,
	className,
	closeLabel = "Close",
	hasPortal = false,
	shouldShowClose = true,
	role = "dialog",
	id,
	anchorRef,
	width,
	style,
}: MenuPanelProps) {
	const [rendered, setRendered] = useState(open);
	const panelRef = useRef<HTMLDivElement>(null);
	const panelStyle = variant === "modal" && width ? ({ ...style, "--menu-panel-width": width } as CSSProperties) : style;
	const shouldPortal = hasPortal || variant === "modal";

	useEffect(() => {
		if (!open) return;

		const frame = globalThis.requestAnimationFrame(() => setRendered(true));
		return () => globalThis.cancelAnimationFrame(frame);
	}, [open]);

	useEffect(() => {
		if (!rendered) return;

		function closeOnEscape(event: KeyboardEvent) {
			if (event.key === "Escape") onClose();
		}

		function closeOnOutsideClick(event: PointerEvent) {
			if (variant === "anchored" && !panelRef.current?.contains(event.target as Node) && !anchorRef?.current?.contains(event.target as Node)) {
				onClose();
			}
		}

		document.addEventListener("keydown", closeOnEscape);
		document.addEventListener("pointerdown", closeOnOutsideClick);

		return () => {
			document.removeEventListener("keydown", closeOnEscape);
			document.removeEventListener("pointerdown", closeOnOutsideClick);
		};
	}, [anchorRef, onClose, rendered, variant]);

	if (!rendered) return null;

	const panel = (
		<div
			ref={panelRef}
			id={id}
			role={role}
			aria-modal={variant === "modal" ? true : undefined}
			style={panelStyle}
			onAnimationEnd={() => {
				if (!open) setRendered(false);
			}}
			className={join(
				variant === "modal"
					? "pointer-events-auto max-h-[calc(100vh-2rem)] w-[min(var(--menu-panel-width,32rem),calc(100vw-2rem))] max-w-none overflow-y-auto rounded bg-bg p-5 shadow-main"
					: "pointer-events-auto absolute top-full right-0 z-50 mt-3 w-80 rounded border border-border bg-bg p-2 text-sm shadow-main",
				`${open ? "animate-menu-panel-in" : "animate-menu-panel-out"} ${panelClassName ?? ""}`,
			)}
		>
			{(title || shouldShowClose) && (
				<div className="mb-4 flex shrink-0 items-center justify-between gap-3">
					{title && <h3 className="min-w-0 truncate text-lg font-bold text-text">{title}</h3>}
					{shouldShowClose && (
						<button
							type="button"
							onClick={onClose}
							className="ml-auto grid size-8 shrink-0 cursor-pointer place-items-center rounded text-text-muted hover:text-primary"
							aria-label={closeLabel}
						>
							<X size={18} aria-hidden="true" />
						</button>
					)}
				</div>
			)}
			{children}
			{footer}
		</div>
	);

	let content = panel;

	if (variant === "modal") {
		content = (
			<dialog
				open
				className={join(
					"pointer-events-auto fixed inset-0 m-0 flex h-dvh max-h-none w-dvw max-w-none items-center justify-center border-0 bg-overlay p-4",
					`${open ? "animate-menu-overlay-in" : "animate-menu-overlay-out"} ${className ?? ""}`,
				)}
				onPointerDown={(event) => {
					if (event.target === event.currentTarget) onClose();
				}}
			>
				{panel}
			</dialog>
		);
	} else if (shouldPortal) {
		content = (
			<dialog
				open
				className={join("pointer-events-auto fixed inset-0 m-0 h-dvh max-h-none w-dvw max-w-none border-0", className)}
				onPointerDown={(event) => {
					if (event.target === event.currentTarget) onClose();
				}}
			>
				{panel}
			</dialog>
		);
	}

	if (shouldPortal) {
		return <HighLevelIsland>{content}</HighLevelIsland>;
	}

	return content;
}
