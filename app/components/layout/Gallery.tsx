"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Children, ReactNode, useEffect, useRef, useState } from "react";

type GallaryMode = "slide" | "fade";

type GallaryProps = Readonly<{
	children: ReactNode;
	mode?: GallaryMode;
	shouldAutoRotate?: boolean;
	autoRotateMs?: number;
	idleMs?: number;
}>;

export default function Gallary({ children, mode = "slide", shouldAutoRotate = false, autoRotateMs = 6000, idleMs = 8000 }: GallaryProps) {
	const items = Children.toArray(children);
	const [index, setIndex] = useState(0);
	const hoveredRef = useRef(false);
	const lastInteractionRef = useRef(0);

	useEffect(() => {
		if (!shouldAutoRotate || items.length < 2) return;

		const timer = globalThis.setInterval(() => {
			const isIdle = Date.now() - lastInteractionRef.current > idleMs;

			if (!hoveredRef.current && isIdle) {
				setIndex((current) => (current + 1) % items.length);
			}
		}, autoRotateMs);

		return () => globalThis.clearInterval(timer);
	}, [shouldAutoRotate, autoRotateMs, idleMs, items.length]);

	function markInteraction() {
		lastInteractionRef.current = Date.now();
	}

	function move(direction: -1 | 1) {
		markInteraction();
		setIndex((current) => (current + direction + items.length) % items.length);
	}

	if (!items.length) return null;

	return (
		<div
			className="relative w-full pb-9"
			onPointerEnter={() => {
				hoveredRef.current = true;
			}}
			onPointerLeave={() => {
				hoveredRef.current = false;
			}}
		>
			<button
				type="button"
				aria-label="Previous item"
				onClick={() => move(-1)}
				className="absolute top-6 left-0 z-20 grid h-66 w-8 place-items-center rounded text-text transition-all hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none md:top-0 md:bottom-9 md:h-auto md:w-14 md:border-border/70 md:bg-bg md:backdrop-blur md:hover:border md:hover:bg-bg-secondary/50"
			>
				<ChevronLeft className="size-5 md:size-7" />
			</button>

			<div className="overflow-hidden px-3 md:px-14">
				{mode === "fade" ? (
					<div className="grid">
						{items.map((child, itemIndex) => (
							<div
								key={itemIndex.toLocaleString()}
								className={`col-start-1 row-start-1 transition-opacity duration-300 ease-out ${itemIndex === index ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"}`}
							>
								{child}
							</div>
						))}
					</div>
				) : (
					<div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
						{items.map((child, itemIndex) => (
							<div key={itemIndex.toLocaleString()} className="w-full flex-none">
								{child}
							</div>
						))}
					</div>
				)}
			</div>

			<button
				type="button"
				aria-label="Next item"
				onClick={() => move(1)}
				className="absolute top-6 right-0 z-20 grid h-66 w-8 place-items-center rounded text-text transition-all hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none md:top-0 md:bottom-9 md:h-auto md:w-14 md:border-border/70 md:bg-bg md:backdrop-blur md:hover:border md:hover:bg-bg-secondary/50"
			>
				<ChevronRight className="size-5 md:size-7" />
			</button>

			<div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-2">
				{items.map((_, itemIndex) => (
					<button
						key={itemIndex.toLocaleString()}
						type="button"
						aria-label={`Show item ${itemIndex + 1}`}
						onClick={() => {
							markInteraction();
							setIndex(itemIndex);
						}}
						className={`size-3.5 h-2.5 w-4 rounded transition ${itemIndex === index ? "bg-secondary" : "bg-border hover:bg-border-strong"}`}
					/>
				))}
			</div>
		</div>
	);
}
