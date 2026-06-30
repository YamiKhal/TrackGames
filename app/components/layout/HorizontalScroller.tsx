"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode, useRef, useState, Children, useEffect, PointerEvent } from "react";

type HorizontalScrollerProps = Readonly<{
	children: ReactNode;
	className?: string;
	selectedIndex?: number;
	onSelectedIndexChange?: (index: number) => void;
}>;

export default function HorizontalScroller({ children, className = "", selectedIndex, onSelectedIndexChange }: HorizontalScrollerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const childRefs = useRef<HTMLDivElement[]>([]);
	const didDragRef = useRef(false);
	const isPointerDownRef = useRef(false);
	const startXRef = useRef(0);
	const startScrollLeftRef = useRef(0);
	const [isDragging, setIsDragging] = useState(false);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);

	function update() {
		const container = containerRef.current;
		if (!container) return;

		// add small tolerance to avoid off-by-one issues
		setCanScrollLeft(container.scrollLeft > 1);
		setCanScrollRight(container.scrollLeft + container.clientWidth < container.scrollWidth - 1);
	}

	useEffect(() => {
		update();

		const element = containerRef.current;
		if (element) element.addEventListener("scroll", update, { passive: true });
		window.addEventListener("resize", update);

		const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
		if (observer && element) observer.observe(element);

		return () => {
			if (element) element.removeEventListener("scroll", update);

			window.removeEventListener("resize", update);

			if (observer) observer.disconnect();
		};
	}, []);

	useEffect(() => {
		if (selectedIndex === undefined) return;

		const container = containerRef.current;
		const child = childRefs.current[selectedIndex];
		if (!container || !child) return;

		const containerLeft = container.scrollLeft;
		const containerRight = containerLeft + container.clientWidth;
		const childLeft = child.offsetLeft;
		const childRight = childLeft + child.offsetWidth;

		if (childLeft < containerLeft) {
			container.scrollTo({ left: childLeft, behavior: "smooth" });
		} else if (childRight > containerRight) {
			container.scrollTo({ left: childRight - container.clientWidth, behavior: "smooth" });
		}
	}, [selectedIndex]);

	function scroll(direction: "left" | "right") {
		const container = containerRef.current;
		if (!container) return;

		container.scrollBy({
			left: direction === "left" ? -container.offsetWidth * 0.8 : container.offsetWidth * 0.8,
			behavior: "smooth",
		});
	}

	function select(direction: "left" | "right") {
		if (selectedIndex === undefined || !onSelectedIndexChange) {
			scroll(direction);
			return;
		}

		const childrenCount = Children.count(children);
		const nextIndex = direction === "left" ? Math.max(selectedIndex - 1, 0) : Math.min(selectedIndex + 1, childrenCount - 1);

		onSelectedIndexChange(nextIndex);
	}

	function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
		const container = containerRef.current;
		if (!container) return;

		const offsetLeft = e.currentTarget?.offsetLeft || 0;
		isPointerDownRef.current = true;
		didDragRef.current = false;
		startXRef.current = e.clientX - offsetLeft;
		startScrollLeftRef.current = container.scrollLeft;
	}

	function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
		const container = containerRef.current;
		if (!container) return;
		if (!isPointerDownRef.current) return;

		const offsetLeft = e.currentTarget?.offsetLeft || 0;
		const x = e.clientX - offsetLeft;
		const distance = x - startXRef.current;

		if (!isDragging && Math.abs(distance) < 5) return;

		if (!isDragging) {
			didDragRef.current = true;
			setIsDragging(true);
			try {
				e.currentTarget.setPointerCapture?.(e.pointerId);
			} catch {}
		}

		container.scrollLeft = startScrollLeftRef.current - distance * 1.5;
		e.preventDefault();
	}

	function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
		isPointerDownRef.current = false;
		setIsDragging(false);
		try {
			e.currentTarget.releasePointerCapture?.(e.pointerId);
		} catch {}
	}

	const hasSelectedMode = selectedIndex !== undefined && Boolean(onSelectedIndexChange);
	const canGoLeft = hasSelectedMode ? selectedIndex > 0 : canScrollLeft;
	const canGoRight = hasSelectedMode ? selectedIndex < Children.count(children) - 1 : canScrollRight;

	return (
		<div className={`relative no-scrollbar w-full max-w-full min-w-0 ${className}`}>
			{canGoLeft && (
				<button
					type="button"
					aria-label={onSelectedIndexChange ? "Show previous media" : "Scroll left"}
					onClick={() => select("left")}
					className="absolute top-1/2 left-0 z-10 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded border-border transition-colors outline-none hover:border hover:bg-bg-secondary/80 hover:text-primary md:h-full md:bg-bg-secondary/60"
				>
					<ChevronLeft size={20} strokeWidth={2} />
				</button>
			)}

			<div
				ref={containerRef}
				className="no-scrollbar flex w-full min-w-0 cursor-grab snap-x snap-mandatory items-start gap-4 overflow-x-auto scroll-smooth active:cursor-grabbing"
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerUp}
				onPointerLeave={handlePointerUp}
				onClickCapture={(e) => {
					if (!didDragRef.current) return;
					didDragRef.current = false;
					e.preventDefault();
					e.stopPropagation();
				}}
			>
				{Children.map(children, (child, i) => (
					<div
						key={child?.toLocaleString()}
						ref={(element) => {
							if (element) childRefs.current[i] = element;
						}}
						className="flex-none"
					>
						{child}
					</div>
				))}
			</div>

			{canGoRight && (
				<button
					type="button"
					aria-label={onSelectedIndexChange ? "Show next media" : "Scroll right"}
					onClick={() => select("right")}
					className="absolute top-1/2 right-0 z-10 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded border-border transition-colors outline-none hover:border hover:bg-bg-secondary/80 hover:text-primary md:h-full md:bg-bg-secondary/60"
				>
					<ChevronRight size={20} strokeWidth={2} />
				</button>
			)}
		</div>
	);
}
