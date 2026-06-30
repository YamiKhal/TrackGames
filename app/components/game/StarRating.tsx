"use client";

import { Star } from "lucide-react";
import { useState } from "react";

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

	return (
		<div className="flex items-center gap-3">
			{name && <input type="hidden" name={name} value={value} />}
			<div className="flex items-center gap-0.5" onPointerLeave={() => setHover(null)} aria-label={rating === null ? "No rating" : `Rating ${rating} out of 5`}>
				{Array.from({ length: 5 }, (_, index) => {
					const fill = Math.round(Math.min(1, Math.max(0, shown - index)) * 100);
					const style = { width: size, height: size };

					if (!isInteractive) {
						return (
							<span key={index} className="relative text-text-faint" style={style}>
								<Star size={size} strokeWidth={0.75} aria-hidden="true" />
								<span className="pointer-events-none absolute inset-0 overflow-hidden text-primary" style={{ width: `${fill}%` }}>
									<Star size={size} strokeWidth={0.75} className="fill-primary" aria-hidden="true" />
								</span>
							</span>
						);
					}

					return (
						<button
							key={index}
							type="button"
							onPointerMove={(event) => setHover(pick(event.currentTarget, event.clientX, index))}
							onClick={(event) => {
								const next = pick(event.currentTarget, event.clientX, index);
								onChange?.(value === next ? 0 : next);
							}}
							className="relative cursor-pointer text-text-faint transition hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
							style={style}
							aria-label={`${index + 1} star rating`}
						>
							<Star size={size} strokeWidth={0.75} aria-hidden="true" />
							<span className="pointer-events-none absolute inset-0 overflow-hidden text-primary" style={{ width: `${fill}%` }}>
								<Star size={size} strokeWidth={0.75} className="fill-primary" aria-hidden="true" />
							</span>
						</button>
					);
				})}
			</div>
			{shouldShowValue && <span className="text-sm font-bold text-text-muted">{value ? value.toFixed(1) : "No rating"}</span>}
		</div>
	);
}
