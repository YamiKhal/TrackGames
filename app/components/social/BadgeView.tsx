import { BadgeCheck } from "lucide-react";
import Image from "next/image";

type BadgeViewProps = Readonly<{ badge: { name: string; description: string | null; icon: string | null; color: string | null } }>;

export default function BadgeView({ badge }: BadgeViewProps) {
	const color = badge.color ?? "var(--primary)";

	return (
		<div title={badge.description ?? badge.name} className="flex min-w-0 flex-col items-center gap-2 rounded border border-border bg-bg p-2 text-center">
			<div
				className="relative grid size-10 place-items-center overflow-hidden rounded-full"
				style={{ backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`, color }}
			>
				{badge.icon ? <Image src={badge.icon} alt="" fill sizes="40px" className="object-cover" /> : <BadgeCheck size={22} aria-hidden="true" />}
			</div>
			<p className="w-full truncate text-xs font-bold text-text-muted">{badge.name}</p>
		</div>
	);
}
