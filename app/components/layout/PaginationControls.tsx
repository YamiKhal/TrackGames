import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type PaginationControlsProps = Readonly<{
	page: number;
	pageCount: number;
	href?: (page: number) => string;
	onPageChange?: (page: number) => void;
}>;

export default function PaginationControls({ page, pageCount, href, onPageChange }: PaginationControlsProps) {
	const safePageCount = Math.max(1, pageCount);
	const safePage = Math.min(safePageCount, Math.max(1, page));
	const pageNumbers = safePageCount > 7 ? [1, 2, 3, 4, 5, 6] : Array.from({ length: safePageCount }, (_, index) => index + 1);

	if (safePageCount <= 1) return null;

	function goToPage(value: number) {
		onPageChange?.(Math.min(safePageCount, Math.max(1, value)));
	}

	function renderPageButton(value: number, label: string, children: ReactNode, disabled?: boolean) {
		const className = `grid size-9 place-items-center rounded border text-sm font-bold transition-colors ${
			safePage === value ? "border-primary bg-primary text-text" : "border-border text-text-muted hover:border-primary hover:text-primary"
		} ${disabled ? "pointer-events-none opacity-50" : ""}`;

		if (href) {
			return (
				<Link href={href(value)} className={className} aria-label={label} aria-current={safePage === value ? "page" : undefined} aria-disabled={disabled}>
					{children}
				</Link>
			);
		}

		return (
			<button
				type="button"
				onClick={() => goToPage(value)}
				disabled={disabled}
				className={`${className} cursor-pointer disabled:cursor-default`}
				aria-label={label}
				aria-current={safePage === value ? "page" : undefined}
			>
				{children}
			</button>
		);
	}

	function renderArrowButton(value: number, label: string, children: ReactNode, disabled: boolean) {
		const className = `flex items-center justify-center gap-5 rounded border border-text-faint bg-primary/0 px-3 py-2 font-bold text-text-muted transition-colors hover:border-primary hover:text-primary ${disabled ? "pointer-events-none opacity-50" : ""}`;

		if (href) {
			return (
				<Link href={href(value)} className={className} aria-label={label} aria-disabled={disabled}>
					{children}
				</Link>
			);
		}

		return (
			<button type="button" onClick={() => goToPage(value)} disabled={disabled} className={`${className} cursor-pointer disabled:cursor-default`} aria-label={label}>
				{children}
			</button>
		);
	}

	return (
		<div className="flex flex-row items-center justify-center gap-3">
			{renderArrowButton(safePage - 1, "Previous page", <ChevronLeft size={18} aria-hidden="true" />, safePage === 1)}
			<p className="text-sm font-bold text-text-muted sm:hidden">
				{safePage} / {safePageCount}
			</p>
			<div className="hidden flex-row items-center gap-2 sm:flex">
				{pageNumbers.map((number) => (
					<span key={number}>{renderPageButton(number, `Page ${number}`, number)}</span>
				))}
				{safePageCount > 7 && (
					<>
						{!href && (
							<input
								type="number"
								min={1}
								max={safePageCount}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										goToPage(Number(event.currentTarget.value));
										event.currentTarget.value = "";
									}
								}}
								className="h-9 w-14 rounded border border-border bg-bg-secondary px-2 text-center text-sm text-text transition-colors outline-none focus:border-primary"
								aria-label="Jump to page"
							/>
						)}
						{renderPageButton(safePageCount, `Page ${safePageCount}`, safePageCount)}
					</>
				)}
			</div>
			{renderArrowButton(safePage + 1, "Next page", <ChevronRight size={18} aria-hidden="true" />, safePage === safePageCount)}
		</div>
	);
}
