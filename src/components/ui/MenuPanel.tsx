"use client";

import type { CSSProperties, ReactNode, RefObject } from "react";
import { X } from "lucide-react";
import HighLevelIsland from "@/components/ui/HighLevelIsland";
import { joinClass } from "@/lib/util/client/func";
import { useOverlay } from "@/lib/util/client/useOverlay";

type MenuPanelProps = Readonly<{
	open: boolean;
	onClose: () => void;
	title?: ReactNode;
	children: ReactNode;
	footer?: ReactNode;
	variant?: "modal" | "anchored" | "drawer-left" | "drawer-right";
	panelClassName?: string;
	className?: string;
	closeLabel?: string;
	shouldShowClose?: boolean;
	role?: string;
	id?: string;
	anchorRef?: RefObject<HTMLElement | null>;
	width?: string;
	style?: CSSProperties;
}>;

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
	shouldShowClose = true,
	role = "dialog",
	id,
	anchorRef,
	width,
	style,
}: MenuPanelProps) {
	const isDrawer = variant === "drawer-left" || variant === "drawer-right";
	const shouldPortal = variant !== "anchored";
	const { rendered, panelRef, attachDialog, handleCancel, handleAnimationEnd } = useOverlay(open, onClose, variant === "anchored" ? anchorRef : undefined);
	const panelStyle = (variant === "modal" || isDrawer) && width ? ({ ...style, "--menu-panel-width": width } as CSSProperties) : style;
	const panelAnimation = variant === "drawer-left" ? "animate-menu-drawer-left" : variant === "drawer-right" ? "animate-menu-drawer" : "animate-menu-panel";

	if (!rendered) return null;

	const panel = (
		<div
			ref={panelRef}
			id={id}
			role={role}
			tabIndex={-1}
			aria-modal={shouldPortal ? true : undefined}
			style={panelStyle}
			onAnimationEnd={handleAnimationEnd}
			className={joinClass(
				variant === "modal" &&
					"pointer-events-auto max-h-[calc(100vh-2rem)] w-[min(var(--menu-panel-width,32rem),calc(100vw-2rem))] max-w-none overflow-y-auto rounded bg-bg p-5 shadow-main",
				variant === "anchored" && "pointer-events-auto absolute top-full right-0 z-50 mt-3 w-80 rounded border border-border bg-bg p-2 text-sm shadow-main",
				isDrawer &&
					joinClass(
						"pointer-events-auto fixed inset-y-0 h-full w-[min(var(--menu-panel-width,20rem),100vw)] overflow-y-auto bg-bg p-5 shadow-main",
						variant === "drawer-left" ? "left-0 border-r border-border" : "right-0 border-l border-border",
					),
				`${panelAnimation}-${open ? "in" : "out"}`,
				panelClassName,
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

	if (!shouldPortal) return panel;

	const content = (
		<dialog
			ref={attachDialog}
			className={joinClass(
				"pointer-events-auto fixed inset-0 m-0 h-dvh max-h-none w-dvw max-w-none border-0 bg-overlay",
				variant === "modal" ? "flex items-center justify-center p-4" : "p-0",
				`animate-menu-overlay-${open ? "in" : "out"}`,
				className,
			)}
			onCancel={handleCancel}
			onPointerDown={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
		>
			{panel}
		</dialog>
	);

	return <HighLevelIsland>{content}</HighLevelIsland>;
}
