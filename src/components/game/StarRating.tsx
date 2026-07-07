"use client";

import { useState } from "react";
import { Star } from "lucide-react";

type StarRatingProps = Readonly<{
	rating?: number | null;
	size?: number;
	isInteractive?: boolean;
	shouldShowValue?: boolean;
	name?: string;
	onChange?: (value: number) => void;
}>;

function pick(element: HTMLButtonElement, clientX: number, star: number) {
	const rect = element.getBoundingClientRect();
	const point = (clientX - rect.left) / rect.width;

	if (point < 0.25) return star;
	return star + (point < 0.625 ? 0.5 : 1);
}

export default function StarRating({ rating, size = 12, isInteractive = false, shouldShowValue = false, name, onChange }: StarRatingProps) {
	const [hover, setHover] = useState<number | null>(null);
	const value = rating ?? 0;
	const shown = isInteractive ? (hover ?? value) : value;
	const isPreviewing = isInteractive && hover !== null;

	return (
		<div className="flex items-center gap-3">
			{name && <input type="hidden" name={name} value={value} />}
			<div className="flex items-center gap-0.5" onPointerLeave={() => setHover(null)} aria-label={rating === null ? "No rating" : `Rating ${rating} out of 5`}>
				{Array.from({ length: 5 }, (_, index) => {
					const fill = Math.round(Math.min(1, Math.max(0, shown - index)) * 100);
					const style = { width: size, height: size };

					const overlay = (
						<span
							className={`pointer-events-none absolute inset-0 overflow-hidden ease-out motion-safe:transition-[width,color] motion-safe:duration-200 ${isPreviewing ? "text-primary-hover" : "text-primary"}`}
							style={{ width: `${fill}%` }}
						>
							<Star size={size} strokeWidth={0.75} className="fill-current" aria-hidden="true" />
						</span>
					);

					if (!isInteractive) {
						return (
							<span key={index} className="relative text-text-faint" style={style}>
								<Star size={size} strokeWidth={0.75} aria-hidden="true" />
								{overlay}
							</span>
						);
					}

					return (
						<button
							key={index}
							type="button"
							onPointerMove={(event) => setHover(pick(event.currentTarget, event.clientX, index))}
							onClick={(event) => {
								const picked = pick(event.currentTarget, event.clientX, index);
								onChange?.(picked === value ? 0 : picked);
							}}
							className="relative cursor-pointer text-text-faint transition-transform duration-150 ease-out focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none motion-safe:active:scale-90"
							style={style}
							aria-label={`${index + 1} star rating`}
						>
							<Star size={size} strokeWidth={0.75} aria-hidden="true" />
							{overlay}
						</button>
					);
				})}
			</div>
			{shouldShowValue && <span className="text-sm font-bold text-text-muted">{value ? value.toFixed(1) : "No rating"}</span>}
		</div>
	);
}
