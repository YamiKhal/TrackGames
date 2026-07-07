import { joinClass } from "@/lib/util/client/func";

// Pulsing indicator used to draw attention to items that need action (open reports, new feedback).
export default function FlashDot({ className }: Readonly<{ className?: string }>) {
	return (
		<span className={joinClass("relative flex size-2.5", className)} aria-hidden="true">
			<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-75" />
			<span className="relative inline-flex size-2.5 rounded-full bg-error" />
		</span>
	);
}
