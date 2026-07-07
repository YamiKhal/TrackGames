import { joinClass } from "@/lib/util/client/func";
import { formatNumber } from "@/lib/util/format/numbers";

export type ChartPoint = { label: string; value: number };

// Dependency-free SVG charts, themed with the app's CSS color tokens (single hue,
// muted gridlines). Static — safe to render on the server.

export function BarChart({ data, className }: Readonly<{ data: ChartPoint[]; className?: string }>) {
	const max = Math.max(1, ...data.map((point) => point.value));

	if (!data.length) return <p className="text-sm text-text-faint">No data yet.</p>;

	return (
		<div className={joinClass("flex flex-col gap-2", className)}>
			{data.map((point) => (
				<div key={point.label} className="flex items-center gap-3 text-xs">
					<span className="w-24 shrink-0 truncate text-text-muted" title={point.label}>
						{point.label}
					</span>
					<span className="h-3 flex-1 overflow-hidden rounded-full bg-bg-secondary">
						<span className="block h-full rounded-full bg-primary" style={{ width: `${(point.value / max) * 100}%` }} />
					</span>
					<span className="w-10 shrink-0 text-right font-bold text-text tabular-nums" title={point.value.toLocaleString()}>
						{formatNumber(point.value)}
					</span>
				</div>
			))}
		</div>
	);
}

export function LineChart({ data, height = 160, className }: Readonly<{ data: ChartPoint[]; height?: number; className?: string }>) {
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

	return (
		<div className={className}>
			<svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={`Trend chart, ${total} total over ${data.length} points`}>
				<polygon points={area} className="fill-primary/10" />
				<polyline points={line} fill="none" className="stroke-primary" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
			</svg>
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
