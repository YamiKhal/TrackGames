"use client";

import type { CSSProperties, ReactElement, ReactNode, RefObject } from "react";
import { cloneElement, useEffect, useState } from "react";
import type ConfirmAction from "@/components/ui/ConfirmAction";
import HighLevelIsland from "@/components/ui/HighLevelIsland";
import { joinClass } from "@/lib/util/client/func";
import { useOverlay } from "@/lib/util/client/useOverlay";
import { GhostButton, PrimaryButton } from "./control/Button";

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
	isConfirm?: boolean;
	confirmModal?: ReactElement<Parameters<typeof ConfirmAction>[0]>;
	isDirty?: boolean;
	submitLabel?: ReactNode;
	formId?: string;
	onSubmit?: () => void;
	isSubmitPending?: boolean;
	isSubmitDisabled?: boolean;
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
	isConfirm: confirm = false,
	confirmModal,
	isDirty: dirty,
	submitLabel,
	formId,
	onSubmit,
	isSubmitPending = false,
	isSubmitDisabled = false,
	role = "dialog",
	id,
	anchorRef,
	width,
	style,
}: MenuPanelProps) {
	const isDrawer = variant === "drawer-left" || variant === "drawer-right";
	const shouldPortal = variant !== "anchored";
	const [confirming, setConfirming] = useState(false);
	const requestClose = () => {
		if (confirm && dirty !== false && !confirming) {
			setConfirming(true);
			return;
		}
		setConfirming(false);
		onClose();
	};
	const { rendered, panelRef, attachDialog, handleCancel, handleAnimationEnd } = useOverlay(open, requestClose, variant === "anchored" ? anchorRef : undefined);
	const [anchorPos, setAnchorPos] = useState<{ top: number; left: number; minWidth: number; maxHeight: number } | null>(null);

	useEffect(() => {
		if (variant !== "anchored" || !rendered || !open || !anchorRef?.current) {
			setAnchorPos(null);
			return;
		}
		function update() {
			const anchor = anchorRef?.current;
			if (!anchor) return;
			// The panel mounts a frame later (its portal defers), so position from the anchor rect
			// right away and refine flip/clamp once the panel exists.
			const panel = panelRef.current;
			const panelHeight = panel?.offsetHeight ?? 0;
			const rect = anchor.getBoundingClientRect();
			const gap = 8;
			const margin = 8;
			const spaceBelow = globalThis.innerHeight - rect.bottom - gap - margin;
			const spaceAbove = rect.top - gap - margin;
			const openUp = panelHeight > 0 && spaceBelow < panelHeight && spaceAbove > spaceBelow;
			const maxHeight = Math.max(120, openUp ? spaceAbove : spaceBelow);
			const panelWidth = Math.max(panel?.offsetWidth ?? 0, rect.width);
			const left = Math.max(margin, Math.min(rect.left, globalThis.innerWidth - panelWidth - margin));
			const top = openUp ? Math.max(margin, rect.top - gap - Math.min(panelHeight, maxHeight)) : rect.bottom + gap;
			setAnchorPos({ top, left, minWidth: rect.width, maxHeight });
		}
		update();
		const raf = globalThis.requestAnimationFrame(update);
		const timer = globalThis.setTimeout(update, 0);
		globalThis.addEventListener("scroll", update, true);
		globalThis.addEventListener("resize", update);
		return () => {
			globalThis.cancelAnimationFrame(raf);
			globalThis.clearTimeout(timer);
			globalThis.removeEventListener("scroll", update, true);
			globalThis.removeEventListener("resize", update);
		};
	}, [variant, rendered, open, anchorRef, panelRef]);

	const panelStyle =
		variant === "anchored"
			? ({
					...style,
					position: "fixed",
					top: anchorPos?.top,
					left: anchorPos?.left,
					right: "auto",
					minWidth: anchorPos?.minWidth,
					maxHeight: anchorPos?.maxHeight,
					visibility: anchorRef && !anchorPos ? "hidden" : "visible",
				} as CSSProperties)
			: (variant === "modal" || isDrawer) && width
				? ({ ...style, "--menu-panel-width": width } as CSSProperties)
				: style;
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
					"shadow-main pointer-events-auto max-h-[calc(100vh-2rem)] w-[min(var(--menu-panel-width,32rem),calc(100vw-2rem))] max-w-none overflow-y-auto rounded bg-bg p-5",
				variant === "anchored" && "shadow-main pointer-events-auto fixed z-dropdown rounded border border-border bg-bg p-2 text-sm",
				isDrawer &&
					joinClass(
						"shadow-main pointer-events-auto fixed inset-y-0 h-full w-[min(var(--menu-panel-width,20rem),100vw)] overflow-y-auto bg-bg p-5",
						variant === "drawer-left" ? "left-0 border-r border-border" : "right-0 border-l border-border",
					),
				`${panelAnimation}-${open ? "in" : "out"}`,
				panelClassName,
			)}
		>
			{title && (
				<div className="mb-4 flex shrink-0 items-center gap-3">
					<h3 className="min-w-0 truncate text-lg font-bold text-text">{title}</h3>
				</div>
			)}
			{confirming && !confirmModal ? (
				<div className="flex flex-col gap-4">
					<p className="text-sm text-text-muted">Are you sure?</p>
					<div className="flex justify-end gap-2">
						<GhostButton variant="outline" type="button" onClick={() => setConfirming(false)}>
							Back
						</GhostButton>
						<PrimaryButton
							type="button"
							onClick={() => {
								setConfirming(false);
								onClose();
							}}
						>
							{closeLabel}
						</PrimaryButton>
					</div>
				</div>
			) : (
				children
			)}
			{(!confirming || confirmModal) && (footer || shouldShowClose || submitLabel) && (
				<div className="mt-4 flex shrink-0 items-center justify-between gap-2">
					{shouldShowClose ? (
						<GhostButton variant="outline" type="button" onClick={requestClose}>
							{closeLabel}
						</GhostButton>
					) : (
						<span />
					)}
					<div className="flex items-center gap-2">
						{footer}
						{submitLabel && (
							<PrimaryButton type="submit" form={formId} onClick={onSubmit} disabled={isSubmitPending || isSubmitDisabled}>
								{submitLabel}
							</PrimaryButton>
						)}
					</div>
				</div>
			)}
		</div>
	);

	const confirmOverlay =
		confirmModal &&
		cloneElement(confirmModal, {
			open: confirming,
			onClose: () => setConfirming(false),
			onConfirm: () => {
				setConfirming(false);
				onClose();
			},
		});

	if (!shouldPortal)
		return (
			<>
				<HighLevelIsland>
					<dialog
						ref={attachDialog}
						className="pointer-events-auto fixed inset-0 m-0 h-dvh max-h-none w-dvw max-w-none border-0 bg-transparent p-0"
						onCancel={handleCancel}
						onPointerDown={(event) => {
							if (event.target === event.currentTarget) requestClose();
						}}
					>
						{panel}
					</dialog>
				</HighLevelIsland>
				{confirmOverlay}
			</>
		);

	const content = (
		<>
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
					if (event.target === event.currentTarget) requestClose();
				}}
			>
				{panel}
			</dialog>
			{confirmOverlay}
		</>
	);

	return <HighLevelIsland>{content}</HighLevelIsland>;
}
