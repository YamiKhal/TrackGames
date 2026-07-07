"use client";

import { useState } from "react";
import { joinClass } from "@/lib/util/client/func";
import { formatNumber } from "@/lib/util/format/numbers";

export type ChartPoint = { label: string; value: number };

// Categorical hues for the donut, in fixed slot order, drawn from the app's theme
// tokens so segments track light/dark like every other chart. Segments carry direct
// labels in the legend, satisfying the secondary-encoding rule for CVD safety.
const CATEGORICAL = ["var(--primary)", "var(--secondary)", "var(--border)", "var(--success)", "var(--error)", "var(--warning)"];

// Dependency-free SVG charts, themed with the app's CSS color tokens. Interactive:
// hovering surfaces a per-mark tooltip / crosshair.

export function BarChart({ data, className }: Readonly<{ data: ChartPoint[]; className?: string }>) {
	const [hover, setHover] = useState<number | null>(null);
	const max = Math.max(1, ...data.map((point) => point.value));

	if (!data.length) return <p className="text-sm text-text-faint">No data yet.</p>;

	return (
		<div className={joinClass("flex flex-col gap-1", className)}>
			{data.map((point, index) => (
				<div
					key={point.label}
					onMouseEnter={() => setHover(index)}
					onMouseLeave={() => setHover(null)}
					className={joinClass("flex items-center gap-3 rounded px-1 py-1 text-xs transition-colors", hover === index && "bg-bg-secondary/60")}
				>
					<span className="w-24 shrink-0 truncate text-text-muted" title={point.label}>
						{point.label}
					</span>
					<span className="h-3 flex-1 overflow-hidden rounded-full bg-bg-secondary">
						<span
							className={joinClass("block h-full rounded-full transition-colors", hover === index ? "bg-primary-hover" : "bg-primary")}
							style={{ width: `${(point.value / max) * 100}%` }}
						/>
					</span>
					<span className="w-10 shrink-0 text-right font-bold text-text tabular-nums">{formatNumber(point.value)}</span>
				</div>
			))}
		</div>
	);
}

export function LineChart({ data, height = 160, className }: Readonly<{ data: ChartPoint[]; height?: number; className?: string }>) {
	const [hover, setHover] = useState<number | null>(null);

	if (!data.length) return <p className="text-sm text-text-faint">No data yet.</p>;

	const width = 600;
	const pad = 8;
	const max = Math.max(1, ...data.map((point) => point.value));
	const step = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0;
	const y = (value: number) => height - pad - (value / max) * (height - pad * 2);
	const points = data.map((point, index) => [pad + index * step, y(point.value)] as const);
	const line = points.map(([px, py]) => `${px},${py}`).join(" ");
	const area = `${pad},${height - pad} ${line} ${pad + (data.length - 1) * step},${height - pad}`;
	const total = data.reduce((sum, point) => sum + point.value, 0);

	function onMove(event: React.MouseEvent<HTMLDivElement>) {
		const rect = event.currentTarget.getBoundingClientRect();
		const ratio = (event.clientX - rect.left) / rect.width;
		setHover(Math.min(data.length - 1, Math.max(0, Math.round(ratio * (data.length - 1)))));
	}

	return (
		<div className={className}>
			<div className="relative" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
				<svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={`Trend chart, ${total} total over ${data.length} points`}>
					<polygon points={area} className="fill-primary/10" />
					<polyline points={line} fill="none" className="stroke-primary" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
					{hover !== null && (
						<>
							<line x1={points[hover][0]} y1={pad} x2={points[hover][0]} y2={height - pad} className="stroke-border" strokeWidth={1} />
							<circle cx={points[hover][0]} cy={points[hover][1]} r={4} className="fill-primary stroke-bg" strokeWidth={2} />
						</>
					)}
				</svg>
				{hover !== null && (
					<div
						className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded bg-surface px-2 py-1 text-center whitespace-nowrap shadow-lg ring-1 ring-border"
						style={{ left: `${(points[hover][0] / width) * 100}%`, top: `${(points[hover][1] / height) * 100}%` }}
					>
						<div className="text-xs font-bold text-text tabular-nums">{formatNumber(data[hover].value)}</div>
						<div className="text-[0.6rem] text-text-faint">{data[hover].label}</div>
					</div>
				)}
			</div>
			<div className="flex justify-between text-[0.65rem] text-text-faint">
				<span>{data[0].label}</span>
				<span className="font-bold text-text-muted" title={total.toLocaleString()}>
					{formatNumber(total)} total
				</span>
				<span>{data[data.length - 1].label}</span>
			</div>
		</div>
	);
}

// Proportion of a whole across a few categories: a ring of segments plus a legend
// that names and quantifies each (direct labels — never color alone). Hovering a
// segment or legend row highlights it and shows its share in the middle.
export function DonutChart({ data, className }: Readonly<{ data: ChartPoint[]; className?: string }>) {
	const [hover, setHover] = useState<number | null>(null);
	const total = data.reduce((sum, point) => sum + point.value, 0);

	if (!data.length || total === 0) return <p className="text-sm text-text-faint">No data yet.</p>;

	const radius = 42;
	const circumference = 2 * Math.PI * radius;
	const gap = 3; // surface gap between segments, in circumference units

	const segments = data.map((point, index) => {
		const fraction = point.value / total;
		const before = data.slice(0, index).reduce((sum, prev) => sum + prev.value, 0) / total;
		const length = Math.max(0, fraction * circumference - gap);
		return { color: CATEGORICAL[index % CATEGORICAL.length], dash: `${length} ${circumference - length}`, offset: -before * circumference, pct: Math.round(fraction * 100) };
	});

	return (
		<div className={joinClass("flex items-center gap-5", className)}>
			<div className="relative size-28 shrink-0">
				<svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label="Distribution">
					{segments.map((segment, index) => (
						<circle
							key={index}
							cx="50"
							cy="50"
							r={radius}
							fill="none"
							stroke={segment.color}
							strokeWidth={hover === index ? 17 : 14}
							strokeDasharray={segment.dash}
							strokeDashoffset={segment.offset}
							className={joinClass("cursor-pointer transition-[stroke-width,opacity]", hover !== null && hover !== index && "opacity-40")}
							onMouseEnter={() => setHover(index)}
							onMouseLeave={() => setHover(null)}
						/>
					))}
				</svg>
				<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
					<span className="text-lg font-bold text-text tabular-nums">{hover === null ? formatNumber(total) : `${segments[hover].pct}%`}</span>
					<span className="max-w-full truncate px-1 text-[0.6rem] text-text-faint">{hover === null ? "total" : data[hover].label}</span>
				</div>
			</div>
			<ul className="flex min-w-0 flex-1 flex-col gap-0.5 text-xs">
				{data.map((point, index) => (
					<li
						key={point.label}
						onMouseEnter={() => setHover(index)}
						onMouseLeave={() => setHover(null)}
						className={joinClass("flex items-center gap-2 rounded px-1 py-1 transition-colors", hover === index && "bg-bg-secondary/60")}
					>
						<span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: CATEGORICAL[index % CATEGORICAL.length] }} />
						<span className="min-w-0 flex-1 truncate text-text-muted" title={point.label}>
							{point.label}
						</span>
						<span className="font-bold text-text tabular-nums">{formatNumber(point.value)}</span>
						<span className="w-9 shrink-0 text-right text-text-faint tabular-nums">{segments[index].pct}%</span>
					</li>
				))}
			</ul>
		</div>
	);
}

// A single 0-100 headline as a circular progress ring with the value in the middle.
export function RadialGauge({ value, caption, className }: Readonly<{ value: number; caption: string; className?: string }>) {
	const radius = 42;
	const circumference = 2 * Math.PI * radius;
	const pct = Math.min(100, Math.max(0, value));
	const dash = (pct / 100) * circumference;

	return (
		<div className={joinClass("flex flex-col items-center gap-2", className)}>
			<div className="relative size-32">
				<svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label={`${caption}: ${value}%`}>
					<circle cx="50" cy="50" r={radius} fill="none" strokeWidth="10" className="stroke-border" />
					<circle
						cx="50"
						cy="50"
						r={radius}
						fill="none"
						strokeWidth="10"
						strokeLinecap="round"
						className="stroke-primary"
						strokeDasharray={`${dash} ${circumference - dash}`}
					/>
				</svg>
				<span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-text tabular-nums">{value}%</span>
			</div>
			<span className="text-xs text-text-muted">{caption}</span>
		</div>
	);
}
